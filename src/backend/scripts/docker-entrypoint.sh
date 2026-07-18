#!/bin/sh
set -e

cd /app

# Initialize or migrate the database before starting the server.
# This handles three states:
#   1. Fresh database: create tables and stamp at the current Alembic head.
#   2. Existing database without Alembic tracking: determine whether it matches
#      the current head or the previous revision, then stamp appropriately and
#      upgrade if needed.
#   3. Tracked database: run pending Alembic migrations.
uv run python - <<'PY'
from sqlalchemy import create_engine, inspect, text
from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory
from app.core.config import settings
from app.models import Base

# Use a synchronous URL because this script runs before the async app starts.
db_url = settings.db_url.replace("+aiosqlite", "")
engine = create_engine(db_url)

try:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    article_exists = "article" in tables
    alembic_exists = "alembic_version" in tables

    config = Config("/app/alembic.ini")

    if not article_exists:
        # Fresh database: create tables and stamp the current Alembic head.
        Base.metadata.create_all(engine)
        command.stamp(config, "head")
        print("Database initialized with current schema and stamped at head.")
    elif not alembic_exists:
        # Existing database created before Alembic was introduced.  We need to
        # determine whether its schema already matches the current head or is
        # one revision behind, so we can stamp and upgrade safely.
        columns = {c["name"] for c in inspector.get_columns("article_state")}
        read_time_exists = "read_time" in columns

        if read_time_exists:
            # Schema already matches the current head; just start tracking it.
            command.stamp(config, "head")
            print("Existing database schema matches head; stamped at head.")
        else:
            # Schema is at the revision before head.  Stamp at the head's
            # down_revision and run the upgrade to apply the missing change.
            script = ScriptDirectory.from_config(config)
            head_rev = script.get_revision("head")
            down_revision = head_rev.down_revision

            if down_revision:
                # For merge points down_revision can be a tuple; use the first parent.
                target = down_revision[0] if isinstance(down_revision, tuple) else down_revision
                command.stamp(config, target)
                print(f"Existing database stamped at {target} and will be upgraded to head.")
            else:
                # Head is the first revision; it creates the schema itself.
                pass

            command.upgrade(config, "head")
            print("Database migrated to head.")
    else:
        # Tracked database: run pending migrations.
        command.upgrade(config, "head")
        print("Database migrated to head.")
finally:
    engine.dispose()
PY

# Start the server.
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

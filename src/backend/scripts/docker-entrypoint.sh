#!/bin/sh
set -e

cd /app

# Initialize or migrate the database before starting the server.
# This handles both fresh databases (created by Base.metadata.create_all and
# stamped at the current Alembic head) and existing tracked databases.
uv run python - <<'PY'
from sqlalchemy import create_engine, inspect
from alembic.config import Config
from alembic import command
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
        # Existing database created by an older app version that did not use
        # Alembic. Stamp it at the current head so future migrations run cleanly.
        command.stamp(config, "head")
        print("Existing database stamped at head.")
    else:
        # Tracked database: run pending migrations.
        command.upgrade(config, "head")
        print("Database migrated to head.")
finally:
    engine.dispose()
PY

# Start the server.
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

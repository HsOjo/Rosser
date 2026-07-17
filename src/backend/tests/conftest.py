import asyncio
import tempfile
from typing import AsyncGenerator

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.core.database import create_engine

from app.core.security import hash_token

TEST_TOKEN = "test-token-123"


def _get_test_settings():
    tmpdir = tempfile.mkdtemp()
    return Settings(
        rosser_token=TEST_TOKEN,
        rosser_host="127.0.0.1",
        rosser_port=8001,
        rosser_db_url=f"sqlite+aiosqlite:///{tmpdir}/test.db",
        rosser_storage_dir=f"{tmpdir}/storage",
    )


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    from app.core import config
    from app.core import database
    from app.models import Base

    original_settings = config.settings
    test_settings = _get_test_settings()
    config.settings = test_settings

    # Replace the engine with test engine
    original_engine = database.engine
    test_engine = create_engine(test_settings.db_url, echo=False)
    database.engine = test_engine
    database.async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()

    database.engine = original_engine
    database.async_session = async_sessionmaker(original_engine, class_=AsyncSession, expire_on_commit=False)
    config.settings = original_settings


@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    yield
    from app.core.database import engine
    from app.models import Base

    def clear_sync(conn):
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(delete(table))
        conn.commit()

    async with engine.begin() as conn:
        await conn.run_sync(clear_sync)


@pytest_asyncio.fixture
async def client():
    from app.main import app
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {hash_token(TEST_TOKEN)}"}

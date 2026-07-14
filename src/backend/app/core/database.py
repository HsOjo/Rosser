from datetime import datetime
from typing import AsyncGenerator
from uuid import uuid4

from sqlalchemy import Column, DateTime, delete, event, func, select, text
from sqlalchemy.dialects.sqlite import CHAR
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession, AsyncEngine, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings


class Base(DeclarativeBase):
    id: Mapped[str] = mapped_column(
        CHAR(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    create_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    update_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


def _enable_foreign_keys(dbapi_conn, connection_record):
    """Enable SQLite foreign key enforcement on every new connection."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def create_engine(url: str, **kwargs) -> AsyncEngine:
    """Create an async engine with SQLite foreign keys enabled."""
    eng = create_async_engine(url, **kwargs)
    event.listen(eng.sync_engine, "connect", _enable_foreign_keys)
    return eng


engine = create_engine(settings.db_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def cleanup_orphan_articles(session: AsyncSession) -> int:
    """Delete articles whose subscription no longer exists.

    Typically run once at startup to keep the database consistent.
    """
    from app.models import Article, Subscription

    result = await session.execute(
        delete(Article).where(~Article.subscription_id.in_(select(Subscription.id)))
    )
    return result.rowcount


async def cleanup_orphan_article_states(session: AsyncSession) -> int:
    """Delete article states whose article no longer exists."""
    from app.models import Article, ArticleState

    result = await session.execute(
        delete(ArticleState).where(~ArticleState.article_id.in_(select(Article.id)))
    )
    return result.rowcount


async def cleanup_orphan_notifications(session: AsyncSession) -> int:
    """Delete notifications whose subscription no longer exists."""
    from app.models import Notification, Subscription

    result = await session.execute(
        delete(Notification).where(
            Notification.subscription_id.is_not(None),
            ~Notification.subscription_id.in_(select(Subscription.id)),
        )
    )
    return result.rowcount


async def cleanup_orphan_subscription_tags(session: AsyncSession) -> int:
    """Delete rows from the legacy subscription_tag association table that are no longer valid."""
    stmt = text(
        "DELETE FROM subscription_tag "
        "WHERE tag_id NOT IN (SELECT id FROM tag) "
        "OR subscription_id NOT IN (SELECT id FROM subscription)"
    )
    try:
        result = await session.execute(stmt)
        return result.rowcount
    except OperationalError:
        # The legacy table may already have been dropped by a migration.
        return 0

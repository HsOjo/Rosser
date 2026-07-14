import uuid

import aiosqlite
import pytest
from sqlalchemy import select

from app.core import database
from app.models import Article, ArticleState, Notification


class TestCleanup:
    async def _create_subscription(self, client, auth_headers):
        resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Cleanup Feed", "url": "http://cleanup.com/feed.xml"
        })
        return resp.json()["id"]

    async def _create_tag(self, client, auth_headers):
        resp = await client.post("/api/tags", headers=auth_headers, json={"title": "cleanup-tag"})
        return resp.json()["id"]

    async def test_cleanup_orphan_article_states(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)

        async with database.async_session() as session:
            article = Article(subscription_id=sub_id, hash="state-cleanup", title="State Cleanup")
            session.add(article)
            await session.flush()
            state = ArticleState(article_id=article.id)
            session.add(state)
            await session.commit()
            article_id = article.id

        orphan_state_id = str(uuid.uuid4())
        async with aiosqlite.connect(database.engine.url.database) as db:
            await db.execute("PRAGMA foreign_keys=OFF")
            await db.execute(
                "INSERT INTO article_state (id, article_id, is_read, is_hide, is_star) "
                "VALUES (?, '00000000-0000-0000-0000-000000000000', 0, 0, 0)",
                (orphan_state_id,),
            )
            await db.commit()

        async with database.async_session() as session:
            deleted = await database.cleanup_orphan_article_states(session)
            await session.commit()
            assert deleted == 1

        async with database.async_session() as session:
            valid = (await session.execute(
                select(ArticleState).where(ArticleState.article_id == article_id)
            )).scalars().first()
            assert valid is not None
            orphan = (await session.execute(
                select(ArticleState).where(ArticleState.id == orphan_state_id)
            )).scalars().first()
            assert orphan is None

    async def test_cleanup_orphan_notifications(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)

        async with database.async_session() as session:
            notification = Notification(type="test", subscription_id=sub_id)
            session.add(notification)
            await session.commit()
            notification_id = notification.id

        orphan_notification_id = str(uuid.uuid4())
        async with aiosqlite.connect(database.engine.url.database) as db:
            await db.execute("PRAGMA foreign_keys=OFF")
            await db.execute(
                "INSERT INTO notification (id, type, is_read, subscription_id) VALUES (?, 'test', 0, '00000000-0000-0000-0000-000000000000')",
                (orphan_notification_id,),
            )
            await db.commit()

        async with database.async_session() as session:
            deleted = await database.cleanup_orphan_notifications(session)
            await session.commit()
            assert deleted == 1

        async with database.async_session() as session:
            valid = (await session.execute(
                select(Notification).where(Notification.id == notification_id)
            )).scalars().first()
            assert valid is not None
            orphan = (await session.execute(
                select(Notification).where(Notification.id == orphan_notification_id)
            )).scalars().first()
            assert orphan is None

    async def test_cleanup_orphan_subscription_tags(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)
        tag_id = await self._create_tag(client, auth_headers)

        # Recreate the legacy association table used by an old migration.
        async with aiosqlite.connect(database.engine.url.database) as db:
            await db.execute("PRAGMA foreign_keys=OFF")
            await db.execute(
                "CREATE TABLE IF NOT EXISTS subscription_tag ("
                "subscription_id CHAR(36) NOT NULL, "
                "tag_id CHAR(36) NOT NULL, "
                "PRIMARY KEY (subscription_id, tag_id), "
                "FOREIGN KEY (subscription_id) REFERENCES subscription(id) ON DELETE CASCADE, "
                "FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE"
                ")"
            )
            await db.execute(
                "INSERT INTO subscription_tag (subscription_id, tag_id) VALUES (?, ?)",
                (sub_id, tag_id),
            )
            await db.execute(
                "INSERT INTO subscription_tag (subscription_id, tag_id) VALUES (?, '00000000-0000-0000-0000-000000000000')",
                (sub_id,),
            )
            await db.commit()

        async with database.async_session() as session:
            deleted = await database.cleanup_orphan_subscription_tags(session)
            await session.commit()
            assert deleted == 1

        async with aiosqlite.connect(database.engine.url.database) as db:
            cursor = await db.execute("SELECT count(*) FROM subscription_tag")
            count = (await cursor.fetchone())[0]
            assert count == 1

        # Clean up the legacy table so it does not affect other tests.
        async with aiosqlite.connect(database.engine.url.database) as db:
            await db.execute("DROP TABLE subscription_tag")
            await db.commit()

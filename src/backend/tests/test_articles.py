import hashlib


class TestArticles:
    _hash_counter = 0

    async def _create_subscription(self, client, auth_headers):
        resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Test Feed", "url": "http://example.com/feed.xml"
        })
        return resp.json()["id"]

    async def _create_article(self, client, auth_headers, sub_id, title="Test Article", content=None, meta=None):
        from app.core.database import async_session
        from app.models import Article, ArticleState
        TestArticles._hash_counter += 1
        hash_val = hashlib.md5(f"{title}{TestArticles._hash_counter}".encode()).hexdigest()
        async with async_session() as session:
            article = Article(
                subscription_id=sub_id,
                hash=hash_val,
                title=title,
                summary="Summary",
                content=content,
                meta=meta,
                link="http://example.com/article",
                publish_time="2024-01-01T00:00:00+00:00",
            )
            session.add(article)
            await session.flush()
            state = ArticleState(article_id=article.id)
            session.add(state)
            await session.commit()
            return article.id

    async def test_list_articles(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)
        art_id = await self._create_article(
            client, auth_headers, sub_id,
            content=[{"type": "text/html", "value": "<p>content</p>"}],
            meta={"key": "value"},
        )
        await self._create_article(client, auth_headers, sub_id, "Article 2")

        resp = await client.get("/api/articles", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2
        item = next(i for i in data["items"] if i["id"] == art_id)
        assert "content" not in item
        assert "meta" not in item

        resp = await client.get(f"/api/articles/{art_id}", headers=auth_headers)
        assert resp.status_code == 200
        detail = resp.json()
        assert detail["content"] == [{"type": "text/html", "value": "<p>content</p>"}]
        assert detail["meta"] == {"key": "value"}

    async def test_mark_read(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)
        art_id = await self._create_article(client, auth_headers, sub_id)

        resp = await client.post("/api/articles/read", headers=auth_headers, json={"ids": [art_id]})
        assert resp.status_code == 204

        resp = await client.get("/api/articles", headers=auth_headers, params={"is_read": True})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["is_read"] is True

    async def test_recent_sort_uses_state_read_time(self, client, auth_headers):
        from datetime import datetime, timezone
        from sqlalchemy import select
        from app.core.database import async_session
        from app.models import ArticleState

        sub_id = await self._create_subscription(client, auth_headers)
        art1 = await self._create_article(client, auth_headers, sub_id, "Article 1")
        art2 = await self._create_article(client, auth_headers, sub_id, "Article 2")

        async with async_session() as session:
            states = (await session.execute(
                select(ArticleState).where(ArticleState.article_id.in_([art1, art2]))
            )).scalars().all()
            for st in states:
                st.is_read = True
                if st.article_id == art1:
                    st.read_time = datetime(2024, 1, 1, tzinfo=timezone.utc)
                else:
                    st.read_time = datetime(2024, 1, 2, tzinfo=timezone.utc)
            await session.commit()

        resp = await client.get(
            "/api/articles",
            headers=auth_headers,
            params={"is_read": True, "order": "read_time desc"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["items"][0]["id"] == art2
        assert data["items"][1]["id"] == art1

    async def test_mark_star(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)
        art_id = await self._create_article(client, auth_headers, sub_id)

        resp = await client.post("/api/articles/star", headers=auth_headers, json={"ids": [art_id]})
        assert resp.status_code == 204

        resp = await client.get("/api/articles", headers=auth_headers, params={"is_star": True})
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["is_star"] is True

    async def test_search_articles(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)
        await self._create_article(client, auth_headers, sub_id, "Python News")
        await self._create_article(client, auth_headers, sub_id, "JavaScript Tips")

        resp = await client.get("/api/articles", headers=auth_headers, params={"search": "Python"})
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Python News"

    async def test_pagination(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)
        for i in range(5):
            await self._create_article(client, auth_headers, sub_id, f"Article {i}")

        resp = await client.get("/api/articles", headers=auth_headers, params={"page": 1, "size": 2})
        data = resp.json()
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["size"] == 2

    async def test_hide_article(self, client, auth_headers):
        sub_id = await self._create_subscription(client, auth_headers)
        art_id = await self._create_article(client, auth_headers, sub_id)

        resp = await client.post("/api/articles/hide", headers=auth_headers, json={"ids": [art_id]})
        assert resp.status_code == 204

        # Hidden articles should not appear in default list
        resp = await client.get("/api/articles", headers=auth_headers)
        data = resp.json()
        assert data["total"] == 0

        # Hidden articles should appear when filtering by is_hide=true
        resp = await client.get("/api/articles", headers=auth_headers, params={"is_hide": True})
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["is_hide"] is True

        resp = await client.post("/api/articles/unhide", headers=auth_headers, json={"ids": [art_id]})
        assert resp.status_code == 204

        resp = await client.get("/api/articles", headers=auth_headers)
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["is_hide"] is False

    async def test_cleanup_orphan_articles(self, client, auth_headers):
        import uuid

        import aiosqlite
        from sqlalchemy import select
        from app.core.database import async_session, cleanup_orphan_articles, engine
        from app.models import Article

        sub_id = await self._create_subscription(client, auth_headers)
        art_id = await self._create_article(client, auth_headers, sub_id, "Normal Article")

        # Inject an orphan article directly, bypassing FK enforcement.
        orphan_id = str(uuid.uuid4())
        async with aiosqlite.connect(engine.url.database) as db:
            await db.execute("PRAGMA foreign_keys=OFF")
            await db.execute(
                "INSERT INTO article (id, subscription_id, hash, title) VALUES (?, ?, ?, ?)",
                (orphan_id, "00000000-0000-0000-0000-000000000000", "orphanhash", "Orphan Article"),
            )
            await db.commit()

        async with async_session() as session:
            deleted = await cleanup_orphan_articles(session)
            await session.commit()
            assert deleted == 1

        async with async_session() as session:
            normal = (await session.execute(select(Article).where(Article.id == art_id))).scalars().first()
            assert normal is not None
            orphan = (await session.execute(select(Article).where(Article.id == orphan_id))).scalars().first()
            assert orphan is None

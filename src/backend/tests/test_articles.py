import hashlib


class TestArticles:
    _hash_counter = 0

    async def _create_subscription(self, client, auth_headers):
        resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Test Feed", "url": "http://example.com/feed.xml"
        })
        return resp.json()["id"]

    async def _create_article(self, client, auth_headers, sub_id, title="Test Article"):
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
        await self._create_article(client, auth_headers, sub_id)
        await self._create_article(client, auth_headers, sub_id, "Article 2")

        resp = await client.get("/api/articles", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

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

import pytest
import asyncio
from unittest.mock import patch, AsyncMock


class TestSubscriptions:
    async def test_create_subscription(self, client, auth_headers):
        resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Test Feed",
            "url": "http://example.com/feed.xml",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Test Feed"
        assert data["url"] == "http://example.com/feed.xml"
        assert data["id"]

    async def test_list_subscriptions(self, client, auth_headers):
        await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Feed A", "url": "http://a.com/feed.xml"
        })
        await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Feed B", "url": "http://b.com/feed.xml"
        })

        resp = await client.get("/api/subscriptions", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_update_subscription(self, client, auth_headers):
        create_resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Old", "url": "http://old.com/feed.xml"
        })
        sub_id = create_resp.json()["id"]

        resp = await client.put(f"/api/subscriptions/{sub_id}", headers=auth_headers, json={"title": "New"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "New"

    async def test_delete_subscription(self, client, auth_headers):
        create_resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Delete Me", "url": "http://del.com/feed.xml"
        })
        sub_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/subscriptions/{sub_id}", headers=auth_headers)
        assert resp.status_code == 204

        resp = await client.get(f"/api/subscriptions/{sub_id}", headers=auth_headers)
        assert resp.status_code == 404

    async def test_preview_subscription(self, client, auth_headers):
        with patch("app.api.FetchService.preview") as mock_preview:
            mock_preview.return_value = {"title": "Preview Title", "description": "Desc"}
            resp = await client.post("/api/subscriptions/preview", headers=auth_headers, json={
                "url": "http://example.com/feed.xml"
            })
            assert resp.status_code == 200
            assert resp.json()["title"] == "Preview Title"

    async def test_fetch_subscriptions_async_triggers_callback(self, client, auth_headers):
        from app.services.fetch import FetchService
        from app.main import manager

        create_resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Async Fetch", "url": "http://async.com/feed.xml"
        })
        sub_id = create_resp.json()["id"]

        mock_article = AsyncMock()
        mock_article.id = "article-1"
        mock_article.hash = "hash-1"

        callback_called = asyncio.Event()
        received = {}

        async def mock_broadcast(message):
            if message.get("type") == "articles.new":
                received["subscription_id"] = message.get("subscription_id")
                received["count"] = message.get("count")
                callback_called.set()

        with patch.object(manager, "broadcast", mock_broadcast):
            with patch.object(FetchService, "_fetch_feed", return_value=[mock_article]):
                resp = await client.post("/api/subscriptions/fetch", headers=auth_headers, json={"ids": [sub_id]})
                assert resp.status_code == 200
                data = resp.json()
                assert "task_id" in data

                # Wait a bit for the background task to complete and call the callback
                await asyncio.wait_for(callback_called.wait(), timeout=2.0)

        assert received.get("subscription_id") == sub_id
        assert received.get("count") == 1

    async def test_create_subscription_defaults(self, client, auth_headers):
        resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Default Feed",
            "url": "http://example.com/feed.xml",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["refresh_interval"] == 60

    async def test_update_subscription_refresh_interval(self, client, auth_headers):
        create_resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Old", "url": "http://old.com/feed.xml"
        })
        sub_id = create_resp.json()["id"]

        resp = await client.put(f"/api/subscriptions/{sub_id}", headers=auth_headers, json={
            "refresh_interval": 120
        })
        assert resp.status_code == 200
        assert resp.json()["refresh_interval"] == 120

    async def test_site_concurrency_limit(self, client, auth_headers):
        sub_resp = await client.post("/api/subscriptions", headers=auth_headers, json={
            "title": "Site Limit", "url": "http://limit.com/feed.xml"
        })
        site_id = sub_resp.json()["site_id"]
        assert site_id

        get_resp = await client.get(f"/api/sites/{site_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["concurrency_limit"] == 4

        put_resp = await client.put(f"/api/sites/{site_id}", headers=auth_headers, json={
            "concurrency_limit": 2
        })
        assert put_resp.status_code == 200
        assert put_resp.json()["concurrency_limit"] == 2

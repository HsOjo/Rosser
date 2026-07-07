import pytest
from unittest.mock import patch


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

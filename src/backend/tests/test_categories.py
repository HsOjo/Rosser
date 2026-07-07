import pytest


class TestCategories:
    async def test_create_category(self, client, auth_headers):
        resp = await client.post("/api/categories", headers=auth_headers, json={"title": "Tech"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Tech"
        assert data["id"]

    async def test_list_categories(self, client, auth_headers):
        await client.post("/api/categories", headers=auth_headers, json={"title": "Tech"})
        await client.post("/api/categories", headers=auth_headers, json={"title": "News"})

        resp = await client.get("/api/categories", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        titles = {c["title"] for c in data}
        assert titles == {"Tech", "News"}

    async def test_get_category(self, client, auth_headers):
        create_resp = await client.post("/api/categories", headers=auth_headers, json={"title": "Tech"})
        cat_id = create_resp.json()["id"]

        resp = await client.get(f"/api/categories/{cat_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Tech"

    async def test_update_category(self, client, auth_headers):
        create_resp = await client.post("/api/categories", headers=auth_headers, json={"title": "Tech"})
        cat_id = create_resp.json()["id"]

        resp = await client.put(f"/api/categories/{cat_id}", headers=auth_headers, json={"title": "Technology"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Technology"

    async def test_delete_category(self, client, auth_headers):
        create_resp = await client.post("/api/categories", headers=auth_headers, json={"title": "Tech"})
        cat_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/categories/{cat_id}", headers=auth_headers)
        assert resp.status_code == 204

        resp = await client.get(f"/api/categories/{cat_id}", headers=auth_headers)
        assert resp.status_code == 404

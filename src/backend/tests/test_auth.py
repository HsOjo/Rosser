import pytest


class TestAuth:
    async def test_health_no_auth(self, client):
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    async def test_protected_without_token(self, client):
        resp = await client.get("/api/categories")
        assert resp.status_code == 401
        assert "Missing" in resp.json()["detail"]

    async def test_protected_with_wrong_token(self, client):
        resp = await client.get("/api/categories", headers={"Authorization": "Bearer wrong"})
        assert resp.status_code == 401
        assert "Invalid" in resp.json()["detail"]

    async def test_protected_with_valid_token(self, client, auth_headers):
        resp = await client.get("/api/categories", headers=auth_headers)
        assert resp.status_code == 200

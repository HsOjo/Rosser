import pytest

from app.core.security import hash_token


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
        resp = await client.get(
            "/api/categories", headers={"Authorization": f"Bearer {hash_token('wrong')}"}
        )
        assert resp.status_code == 401
        assert "Invalid" in resp.json()["detail"]

    async def test_validate_token_without_auth(self, client):
        resp = await client.get("/api/auth/validate")
        assert resp.status_code == 401

    async def test_validate_token_with_wrong_token(self, client):
        resp = await client.get(
            "/api/auth/validate", headers={"Authorization": f"Bearer {hash_token('wrong')}"}
        )
        assert resp.status_code == 401

    async def test_validate_token_with_valid_token(self, client, auth_headers):
        resp = await client.get("/api/auth/validate", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["valid"] is True

    async def test_token_hash_comparison_is_case_sensitive(self, client, auth_headers):
        # The header value is a hex digest; changing any character should fail.
        wrong_hash = auth_headers["Authorization"].replace("a", "b")
        resp = await client.get("/api/auth/validate", headers={"Authorization": wrong_hash})
        assert resp.status_code == 401

    async def test_protected_with_valid_token(self, client, auth_headers):
        resp = await client.get("/api/categories", headers=auth_headers)
        assert resp.status_code == 200

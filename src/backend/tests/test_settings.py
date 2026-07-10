from app.core.http import get_proxy_url


class TestSettings:
    async def test_get_settings_default(self, client, auth_headers):
        resp = await client.get("/api/settings", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["proxy"]["enabled"] is False
        assert data["proxy"]["url"] is None

    async def test_update_proxy_settings(self, client, auth_headers):
        resp = await client.put("/api/settings", headers=auth_headers, json={
            "proxy": {"enabled": True, "url": "http://127.0.0.1:7890"},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["proxy"]["enabled"] is True
        assert data["proxy"]["url"] == "http://127.0.0.1:7890"
        assert get_proxy_url() == "http://127.0.0.1:7890"

    async def test_update_proxy_settings_disabled(self, client, auth_headers):
        resp = await client.put("/api/settings", headers=auth_headers, json={
            "proxy": {"enabled": False, "url": "http://127.0.0.1:7890"},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["proxy"]["enabled"] is False
        assert data["proxy"]["url"] is None
        assert get_proxy_url() is None

    async def test_update_proxy_settings_invalid_url(self, client, auth_headers):
        resp = await client.put("/api/settings", headers=auth_headers, json={
            "proxy": {"enabled": True, "url": "ftp://127.0.0.1:7890"},
        })
        assert resp.status_code == 422

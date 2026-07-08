from unittest.mock import patch

from app.core.http import get_proxy_url


class TestSettings:
    async def test_get_settings_default(self, client, auth_headers):
        resp = await client.get("/api/settings", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"]
        assert data["auto_refresh_interval"] is None
        assert data["proxy_enabled"] is False
        assert data["proxy_url"] is None

    async def test_update_settings(self, client, auth_headers):
        resp = await client.put("/api/settings", headers=auth_headers, json={
            "auto_refresh_interval": 60,
            "theme": "dark",
            "font_size": "large",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["auto_refresh_interval"] == 60
        assert data["theme"] == "dark"
        assert data["font_size"] == "large"

    async def test_update_settings_reschedules_job(self, client, auth_headers):
        with patch("app.main.scheduler") as mock_scheduler:
            resp = await client.put("/api/settings", headers=auth_headers, json={
                "auto_refresh_interval": 120,
            })
            assert resp.status_code == 200
            mock_scheduler.reschedule_job.assert_called_once()

    async def test_update_proxy_settings(self, client, auth_headers):
        resp = await client.put("/api/settings", headers=auth_headers, json={
            "proxy_enabled": True,
            "proxy_url": "http://127.0.0.1:7890",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["proxy_enabled"] is True
        assert data["proxy_url"] == "http://127.0.0.1:7890"
        assert get_proxy_url() == "http://127.0.0.1:7890"

    async def test_update_proxy_settings_disabled(self, client, auth_headers):
        resp = await client.put("/api/settings", headers=auth_headers, json={
            "proxy_enabled": False,
            "proxy_url": "http://127.0.0.1:7890",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["proxy_enabled"] is False
        assert get_proxy_url() is None

    async def test_update_proxy_settings_invalid_url(self, client, auth_headers):
        resp = await client.put("/api/settings", headers=auth_headers, json={
            "proxy_enabled": True,
            "proxy_url": "ftp://127.0.0.1:7890",
        })
        assert resp.status_code == 422

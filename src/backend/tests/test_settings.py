from unittest.mock import patch


class TestSettings:
    async def test_get_settings_default(self, client, auth_headers):
        resp = await client.get("/api/settings", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"]
        assert data["auto_refresh_interval"] is None

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

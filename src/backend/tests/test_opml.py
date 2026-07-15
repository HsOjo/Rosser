import asyncio
from unittest.mock import patch

import pytest


SAMPLE_OPML = """<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test</title></head>
  <body>
    <outline text="Category A">
      <outline text="Feed A" type="rss" xmlUrl="http://example.com/a.xml" />
      <outline text="Feed B" type="rss" xmlUrl="http://example.com/b.xml" />
    </outline>
    <outline text="Feed C" type="rss" xmlUrl="http://example.com/c.xml" />
  </body>
</opml>
"""


class TestOPML:
    async def test_import_opml_creates_subscriptions_and_categories(self, client, auth_headers):
        resp = await client.post(
            "/api/opml/import",
            headers=auth_headers,
            params={"file": SAMPLE_OPML},
        )
        assert resp.status_code == 200
        assert resp.json()["imported"] == 3

        subs_resp = await client.get("/api/subscriptions", headers=auth_headers)
        assert subs_resp.status_code == 200
        subs = subs_resp.json()
        assert len(subs) == 3
        urls = {s["url"] for s in subs}
        assert urls == {"http://example.com/a.xml", "http://example.com/b.xml", "http://example.com/c.xml"}

        cats_resp = await client.get("/api/categories", headers=auth_headers)
        assert cats_resp.status_code == 200
        cats = cats_resp.json()
        assert len(cats) == 1
        assert cats[0]["title"] == "Category A"

    async def test_import_opml_skips_duplicates(self, client, auth_headers):
        await client.post(
            "/api/opml/import",
            headers=auth_headers,
            params={"file": SAMPLE_OPML},
        )
        resp = await client.post(
            "/api/opml/import",
            headers=auth_headers,
            params={"file": SAMPLE_OPML},
        )
        assert resp.status_code == 200
        assert resp.json()["imported"] == 3

        subs_resp = await client.get("/api/subscriptions", headers=auth_headers)
        assert len(subs_resp.json()) == 3

    async def test_import_opml_triggers_background_fetch(self, client, auth_headers):
        fetched_ids = []
        fetch_done = asyncio.Event()

        async def mock_fetch(sub_id):
            fetched_ids.append(sub_id)
            if len(fetched_ids) == 3:
                fetch_done.set()
            return {"added": 0, "error": None}

        with patch("app.api.FetchService.fetch_subscription", side_effect=mock_fetch):
            resp = await client.post(
                "/api/opml/import",
                headers=auth_headers,
                params={"file": SAMPLE_OPML},
            )
            assert resp.status_code == 200

            await asyncio.wait_for(fetch_done.wait(), timeout=2.0)

        assert len(fetched_ids) == 3

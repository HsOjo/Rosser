from unittest.mock import patch, AsyncMock


class TestFetchService:
    async def test_preview_success(self):
        from app.services.fetch import FetchService

        mock_response = AsyncMock()
        mock_response.content = b'<?xml version="1.0"?><rss><channel><title>Test Feed</title><description>Desc</description></channel></rss>'
        mock_response.raise_for_status = AsyncMock()

        async def mock_get(*args, **kwargs):
            return mock_response

        mock_client = AsyncMock()
        mock_client.get = mock_get

        with patch("httpx.AsyncClient", return_value=mock_client):
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=None)
            result = await FetchService.preview("http://example.com/feed.xml")
            assert "title" in result

    async def test_preview_failure(self):
        from app.services.fetch import FetchService

        async def mock_get(*args, **kwargs):
            raise Exception("Network error")

        mock_client = AsyncMock()
        mock_client.get = mock_get

        with patch("httpx.AsyncClient", return_value=mock_client):
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=None)
            result = await FetchService.preview("http://bad-url.com")
            assert result["title"] is None
            assert result["description"] is None

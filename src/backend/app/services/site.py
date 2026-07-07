import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select

from app.models import File, Site

FETCH_TIMEOUT = 15.0
USER_AGENT = "Rosser/1.0"


class SiteService:
    @classmethod
    async def ensure_site(cls, session, url: str) -> Site:
        from urllib.parse import urljoin, urlparse

        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        result = await session.execute(select(Site).where(Site.url == base_url))
        site = result.scalar_one_or_none()
        if site:
            return site

        site = Site(url=base_url, title=None)
        session.add(site)
        await session.flush()

        # Fetch title and favicon in background (best effort)
        try:
            async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
                resp = await client.get(base_url, headers={"User-Agent": USER_AGENT})
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")

                title_tag = soup.find("title")
                if title_tag:
                    site.title = title_tag.get_text(strip=True)[:255]

                favicon_link = soup.find("link", rel=lambda r: r and "icon" in r.lower())
                favicon_url = None
                if favicon_link and favicon_link.get("href"):
                    favicon_url = urljoin(base_url, favicon_link["href"])
                else:
                    favicon_url = urljoin(base_url, "/favicon.ico")

                if favicon_url:
                    from app.services.file import FileService

                    fav_file = await FileService.get_or_create(session, favicon_url)
                    site.favicon_id = fav_file.id
        except Exception:
            pass

        await session.commit()
        return site

    @classmethod
    async def fetch_site(cls, session, site_id: str) -> Site | None:
        site = await session.get(Site, site_id)
        if not site:
            return None

        try:
            async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
                resp = await client.get(site.url, headers={"User-Agent": USER_AGENT})
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")

                title_tag = soup.find("title")
                if title_tag:
                    site.title = title_tag.get_text(strip=True)[:255]

                from urllib.parse import urljoin

                favicon_link = soup.find("link", rel=lambda r: r and "icon" in r.lower())
                favicon_url = None
                if favicon_link and favicon_link.get("href"):
                    favicon_url = urljoin(site.url, favicon_link["href"])
                else:
                    favicon_url = urljoin(site.url, "/favicon.ico")

                if favicon_url:
                    from app.services.file import FileService

                    fav_file = await FileService.get_or_create(session, favicon_url)
                    site.favicon_id = fav_file.id
        except Exception:
            pass

        await session.commit()
        return site

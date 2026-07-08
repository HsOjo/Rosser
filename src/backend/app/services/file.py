import hashlib
import re
from pathlib import Path
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select

from app.core.config import settings
from app.models import File

IMG_SRC_RE = re.compile(r'src=["\']([^"\']+)["\']')


class FileService:
    @classmethod
    def _hash_url(cls, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()

    @classmethod
    def _rel_path(cls, file_hash: str, ext: str | None) -> str:
        ext = ext or "bin"
        return f"{file_hash[:2]}/{file_hash}.{ext}"

    @classmethod
    def _ext_from_url(cls, url: str) -> str | None:
        path = urlparse(url).path
        if "." in path:
            return path.rsplit(".", 1)[-1].lower()[:8]
        return None

    @classmethod
    async def get_or_create(cls, session, url: str) -> File:
        url_hash = cls._hash_url(url)
        result = await session.execute(select(File).where(File.hash == url_hash))
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        ext = cls._ext_from_url(url)
        rel = cls._rel_path(url_hash, ext)
        file_obj = File(hash=url_hash, extension=ext, url=url, stored=False, rel_path=rel)
        session.add(file_obj)
        await session.flush()
        return file_obj

    @classmethod
    async def download(cls, session, file_id: str) -> Path | None:
        file_obj = await session.get(File, file_id)
        if not file_obj:
            return None

        if file_obj.stored and file_obj.rel_path:
            full = settings.storage_dir / file_obj.rel_path
            if full.exists():
                return full

        # Download
        async with httpx.AsyncClient(timeout=60, follow_redirects=True, proxy=None, trust_env=False) as client:
            try:
                resp = await client.get(file_obj.url, headers={"User-Agent": "Rosser/1.0"})
                resp.raise_for_status()
            except Exception:
                return None

        full = settings.storage_dir / file_obj.rel_path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(resp.content)

        file_obj.stored = True
        await session.commit()
        return full

    @classmethod
    async def localize_images(cls, session, html: str | None, client: httpx.AsyncClient | None = None) -> tuple[str | None, list[str]]:
        if not html:
            return html, []

        file_ids: list[str] = []
        soup = BeautifulSoup(html, "html.parser")
        close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=30, follow_redirects=True, proxy=None, trust_env=False)
            close_client = True

        try:
            for img in soup.find_all("img"):
                src = img.get("src")
                if not src or not isinstance(src, str) or src.startswith("$"):
                    continue
                file_obj = await cls.get_or_create(session, src)
                img["src"] = f"$file@{file_obj.id}"
                file_ids.append(file_obj.id)
        finally:
            if close_client and client is not None:
                await client.aclose()

        return str(soup), file_ids

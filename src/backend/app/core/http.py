import re
from typing import Any

import httpx

from sqlalchemy import select

from app.core.database import async_session
from app.models import SettingsSingleton

DEFAULT_TIMEOUT = 30.0
USER_AGENT = "Rosser/1.0 (+https://github.com/rosser/rosser)"

_PROXY_URL: str | None = None
_PROXY_PATTERN = re.compile(r"^(https?|socks5)://", re.IGNORECASE)


def validate_proxy_url(url: str | None) -> str | None:
    """Validate and normalize proxy URL.

    Accepts http://, https:// and socks5:// schemes. Empty/None is allowed and
    treated as "no proxy". Returns the stripped URL or None.
    """
    if not url:
        return None
    stripped = url.strip()
    if not stripped:
        return None
    if not _PROXY_PATTERN.match(stripped):
        raise ValueError("代理 URL 格式错误，仅支持 http://、https://、socks5://")
    return stripped


def set_proxy(enabled: bool, url: str | None) -> None:
    """Update the in-memory proxy configuration used by create_client."""
    global _PROXY_URL
    if enabled:
        _PROXY_URL = validate_proxy_url(url)
    else:
        _PROXY_URL = None


def get_proxy_url() -> str | None:
    """Return the currently configured proxy URL."""
    return _PROXY_URL


def create_client(*, timeout: float = DEFAULT_TIMEOUT, **kwargs: Any) -> httpx.AsyncClient:
    """Create a globally consistent httpx.AsyncClient.

    The client always disables reading proxy settings from environment
    variables and uses the configured proxy when enabled.
    """
    options = {
        "timeout": timeout,
        "follow_redirects": True,
        "proxy": _PROXY_URL,
        "trust_env": False,
    }
    options.update(kwargs)
    return httpx.AsyncClient(**options)


async def load_proxy_from_db() -> None:
    """Load proxy configuration from SettingsSingleton into memory."""
    async with async_session() as session:
        result = await session.execute(select(SettingsSingleton))
        row = result.scalar_one_or_none()
        if row:
            set_proxy(bool(row.proxy_enabled), row.proxy_url)
        else:
            set_proxy(False, None)

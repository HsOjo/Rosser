import httpx

from app.core.http import create_client, set_proxy, validate_proxy_url


def _proxy_url(client: httpx.AsyncClient) -> str | None:
    if not client._mounts:
        return None
    transport = list(client._mounts.values())[0]
    pool = getattr(transport, "_pool", None)
    if pool is None:
        return None
    proxy = getattr(pool, "_proxy_url", None)
    if proxy is None:
        return None
    return f"{proxy.scheme.decode()}://{proxy.host.decode()}:{proxy.port}"


def test_create_client_without_proxy():
    set_proxy(False, None)
    client = create_client(timeout=10)
    assert isinstance(client, httpx.AsyncClient)
    assert _proxy_url(client) is None
    assert client.timeout.connect == 10


def test_create_client_with_http_proxy():
    set_proxy(True, "http://127.0.0.1:7890")
    client = create_client(timeout=15)
    assert isinstance(client, httpx.AsyncClient)
    assert _proxy_url(client) == "http://127.0.0.1:7890"


def test_create_client_with_socks_proxy():
    set_proxy(True, "socks5://127.0.0.1:7890")
    client = create_client(timeout=15)
    assert isinstance(client, httpx.AsyncClient)
    assert _proxy_url(client) == "socks5://127.0.0.1:7890"


def test_validate_proxy_url_accepts_valid_schemes():
    assert validate_proxy_url("http://host:80") == "http://host:80"
    assert validate_proxy_url("https://host:443") == "https://host:443"
    assert validate_proxy_url("socks5://host:1080") == "socks5://host:1080"


def test_validate_proxy_url_rejects_invalid_scheme():
    try:
        validate_proxy_url("ftp://host:21")
    except ValueError as exc:
        assert "http" in str(exc)
    else:
        raise AssertionError("expected ValueError")


def test_validate_proxy_url_normalizes_empty():
    assert validate_proxy_url(None) is None
    assert validate_proxy_url("") is None
    assert validate_proxy_url("   ") is None


def test_set_proxy_disables_when_not_enabled():
    set_proxy(True, "http://127.0.0.1:7890")
    assert _proxy_url(create_client()) is not None
    set_proxy(False, "http://127.0.0.1:7890")
    assert _proxy_url(create_client()) is None

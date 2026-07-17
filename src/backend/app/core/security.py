import hashlib
import hmac
import time
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core import config

security = HTTPBearer(auto_error=False)


def sign_file_url(file_id: str, exp: int, secret: str) -> str:
    msg = f"{file_id}|{exp}"
    return hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()[:32]


def verify_file_url(file_id: str, exp: int, sig: str, secret: str) -> bool:
    if time.time() > exp:
        return False
    expected = sign_file_url(file_id, exp, secret)
    return hmac.compare_digest(expected, sig)


def hash_token(token: str) -> str:
    """Return the SHA-256 hex digest of the provided token."""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token(token_hash: str, expected_token: str) -> bool:
    """Compare an incoming token hash with the expected token hash in constant time."""
    return hmac.compare_digest(token_hash, hash_token(expected_token))


async def get_current_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    # The client is expected to send the SHA-256 hash of the token in the
    # Authorization header (or query param for WebSocket) so the raw token is
    # never transmitted over the wire.
    token: Optional[str] = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization",
        )

    if not verify_token(token, config.settings.rosser_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return token

import hashlib
import hmac
import time
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

security = HTTPBearer(auto_error=False)


def sign_file_url(file_id: str, exp: int, secret: str) -> str:
    msg = f"{file_id}|{exp}"
    return hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()[:32]


def verify_file_url(file_id: str, exp: int, sig: str, secret: str) -> bool:
    if time.time() > exp:
        return False
    expected = sign_file_url(file_id, exp, secret)
    return hmac.compare_digest(expected, sig)


async def get_current_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    # Allow token in query param for WebSocket
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

    if token != settings.rosser_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return token

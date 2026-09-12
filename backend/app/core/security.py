"""Authentication helpers.

In real mode we verify the Supabase-issued JWT that the frontend sends in the
``Authorization: Bearer <token>`` header. In demo mode we transparently sign the
caller in as a stable demo user so the product is fully explorable without any
credentials configured.
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"
DEMO_USER_EMAIL = "demo@workflow.ai"
DEMO_USER_NAME = "Syed Usama"


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str
    full_name: str
    is_demo: bool = False


_DEMO_USER = AuthUser(
    id=DEMO_USER_ID,
    email=DEMO_USER_EMAIL,
    full_name=DEMO_USER_NAME,
    is_demo=True,
)


def _decode_supabase_jwt(token: str) -> AuthUser:
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured on the server.",
        )
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is missing a subject claim.",
        )
    meta = payload.get("user_metadata") or {}
    return AuthUser(
        id=user_id,
        email=payload.get("email", ""),
        full_name=meta.get("full_name") or meta.get("name") or "",
        is_demo=False,
    )


async def get_current_user(
    authorization: str | None = Header(default=None),
) -> AuthUser:
    """FastAPI dependency that resolves the authenticated user."""
    if settings.is_demo:
        return _DEMO_USER

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    return _decode_supabase_jwt(token)


CurrentUser = Depends(get_current_user)

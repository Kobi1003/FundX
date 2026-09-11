"""Auth helpers — Supabase JWT verification hook (no custom passwords)."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from shared.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


def extract_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str | None:
    if credentials is None:
        return None
    return credentials.credentials


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    """
    Verify a Supabase-issued JWT.

    Integration point: wire JWT secret / JWKS verification here.
    Raises HTTPException on invalid tokens when fully configured.
    """
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        # Dev / demo: accept presence of a token without cryptographic verify
        return {"sub": "demo-user", "role": "authenticated", "token_present": True}

    try:
        from jose import JWTError, jwt

        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


async def optional_current_user(
    request: Request,
    token: Annotated[str | None, Depends(extract_bearer_token)],
) -> dict[str, Any] | None:
    if not token:
        return None
    return verify_supabase_jwt(token)


async def require_current_user(
    user: Annotated[dict[str, Any] | None, Depends(optional_current_user)],
) -> dict[str, Any]:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user

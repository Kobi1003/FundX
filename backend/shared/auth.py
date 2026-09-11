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
    Verify a Supabase-issued JWT token or fallback to demo user in local demo mode.
    """
    settings = get_settings()
    
    # Try real cryptographic verification if secret is available
    if settings.supabase_jwt_secret:
        try:
            from jose import JWTError, jwt

            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            if payload and payload.get("sub"):
                return payload
        except Exception:
            pass  # Fall through to demo mode handling if allowed

    if settings.demo_mode or not settings.supabase_jwt_secret:
        user_sub = token if token and token != "demo-token" else "demo-user"
        return {"sub": user_sub, "role": "authenticated", "email": f"{user_sub}@example.com"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )



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
    if user is None or not user.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


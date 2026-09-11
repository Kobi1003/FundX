"""User service — profiles; Supabase Auth owns authentication."""

from __future__ import annotations

import os
import sys
from typing import Annotated, Any

from fastapi import Depends, FastAPI
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.auth import optional_current_user, require_current_user  # noqa: E402
from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402

SERVICE_NAME = os.getenv("SERVICE_NAME", "user-service")

app = FastAPI(title="User Service", version="0.1.0")

# In-memory demo store until Supabase is wired
_PROFILES: dict[str, dict[str, Any]] = {}


class ProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    role: str = Field(default="startup", pattern="^(startup|investor|admin)$")
    email: str | None = None


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    role: str
    email: str | None = None


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/profile")
async def get_profile(
    user: Annotated[dict[str, Any] | None, Depends(optional_current_user)],
) -> dict[str, Any]:
    user_id = (user or {}).get("sub", "demo-user")
    if user_id in _PROFILES:
        return _PROFILES[user_id]
    return {
        "id": user_id,
        "full_name": "Demo User",
        "role": "startup",
        "email": None,
        "note": "Placeholder profile — wire to Supabase profiles table",
    }


@app.post("/profile", response_model=ProfileResponse)
async def upsert_profile(
    payload: ProfileCreate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> ProfileResponse:
    user_id = user.get("sub", "demo-user")
    profile = {
        "id": user_id,
        "full_name": payload.full_name,
        "role": payload.role,
        "email": payload.email,
    }
    _PROFILES[user_id] = profile
    return ProfileResponse(**profile)

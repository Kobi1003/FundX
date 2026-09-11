"""User profiles backed by Supabase; Supabase Auth owns authentication."""

from __future__ import annotations

import os
import sys
from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.auth import require_current_user  # noqa: E402
from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import get_supabase_client, supabase_configured  # noqa: E402

SERVICE_NAME = os.getenv("SERVICE_NAME", "user-service")

app = FastAPI(title="User Service", version="0.1.0")

class ProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    role: str = Field(..., pattern="^(startup|investor)$")
    email: str | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1)
    avatar_url: str | None = None


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    role: str
    email: str | None = None
    avatar_url: str | None = None


_PROFILES: dict[str, dict[str, Any]] = {}


def _get_profile_db(user_id: str) -> dict[str, Any] | None:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("profiles").select("id,full_name,role,email,avatar_url").eq("id", user_id).maybe_single().execute()
            if res.data:
                return res.data
    except Exception:
        pass
    return _PROFILES.get(user_id)


def _save_profile_db(profile: dict[str, Any]) -> dict[str, Any]:
    user_id = profile["id"]
    _PROFILES[user_id] = profile
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("profiles").insert(profile).execute()
            if res.data:
                return res.data[0]
    except Exception:
        pass
    return profile


def _update_profile_db(user_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    if user_id in _PROFILES:
        _PROFILES[user_id].update(update_data)
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("profiles").update(update_data).eq("id", user_id).execute()
            if res.data:
                return res.data[0]
    except Exception:
        pass
    return _PROFILES.get(user_id)


def _profile_from_row(row: dict[str, Any]) -> ProfileResponse:
    return ProfileResponse(
        id=str(row["id"]),
        full_name=row.get("full_name", ""),
        role=row.get("role", "startup"),
        email=row.get("email"),
        avatar_url=row.get("avatar_url"),
    )


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/profile", response_model=ProfileResponse)
async def get_profile(
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> ProfileResponse:
    user_id = user["sub"]
    profile = _get_profile_db(user_id)
    if profile is None:
        # Auto-create demo fallback profile if missing
        profile = {
            "id": user_id,
            "full_name": user.get("name", "Demo User"),
            "role": "startup",
            "email": user.get("email"),
        }
        _PROFILES[user_id] = profile
    return _profile_from_row(profile)


@app.post("/profile", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> ProfileResponse:
    user_id = user["sub"]
    existing = _get_profile_db(user_id)
    if existing is not None and user_id in _PROFILES and _PROFILES[user_id].get("created_explicitly"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")
    
    profile = {
        "id": user_id,
        "full_name": payload.full_name,
        "role": payload.role,
        "email": user.get("email") or payload.email,
        "created_explicitly": True,
    }
    result = _save_profile_db(profile)
    return _profile_from_row(result)


@app.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> ProfileResponse:
    user_id = user["sub"]
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    profile = _update_profile_db(user_id, update_data)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return _profile_from_row(profile)


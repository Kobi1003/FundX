"""Investor service — profile, documents, preferences, AI assessment hooks."""

from __future__ import annotations

import os
import sys
import uuid
from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.auth import require_current_user  # noqa: E402
from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import get_supabase_client, supabase_configured  # noqa: E402

SERVICE_NAME = os.getenv("SERVICE_NAME", "investor-service")

app = FastAPI(title="Investor Service", version="0.1.0")


class InvestorCreate(BaseModel):
    display_name: str = Field(..., min_length=1)
    firm: str | None = None
    bio: str | None = None
    thesis: str | None = None


class InvestorUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1)
    firm: str | None = None
    bio: str | None = None
    thesis: str | None = None


class PreferencesUpdate(BaseModel):
    industries: list[str] = Field(default_factory=list)
    stages: list[str] = Field(default_factory=list)
    check_size_min: float | None = None
    check_size_max: float | None = None
    risk_appetite: str | None = None
    geographies: list[str] = Field(default_factory=list)
    notes: str | None = None


class DocumentMeta(BaseModel):
    filename: str
    doc_type: str | None = "cv"
    storage_path: str | None = None


_INVESTORS: dict[str, dict[str, Any]] = {}
_PREFERENCES: dict[str, dict[str, Any]] = {}


def _get_investor_db(investor_id: str) -> dict[str, Any] | None:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("investors").select("*").eq("id", investor_id).maybe_single().execute()
            if res.data:
                return res.data
    except Exception:
        pass
    return _INVESTORS.get(investor_id)


def _get_investor_by_owner(owner_id: str) -> dict[str, Any] | None:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("investors").select("*").eq("owner_id", owner_id).maybe_single().execute()
            if res.data:
                return res.data
    except Exception:
        pass
    for item in _INVESTORS.values():
        if item.get("owner_id") == owner_id:
            return item
    return None


def _save_investor_db(data: dict[str, Any]) -> dict[str, Any]:
    investor_id = data.get("id") or str(uuid.uuid4())
    data["id"] = investor_id
    _INVESTORS[investor_id] = data
    _PREFERENCES[investor_id] = {"investor_id": investor_id}
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("investors").insert(data).execute()
            if res.data:
                return res.data[0]
    except Exception:
        pass
    return data


def _update_investor_db(investor_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    if investor_id in _INVESTORS:
        _INVESTORS[investor_id].update(update_data)
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("investors").update(update_data).eq("id", investor_id).execute()
            if res.data:
                return res.data[0]
    except Exception:
        pass
    return _INVESTORS.get(investor_id)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/investors")
async def list_investors() -> list[dict[str, Any]]:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("investors").select("*").execute()
            if res.data:
                return res.data
    except Exception:
        pass
    return list(_INVESTORS.values())


@app.get("/investors/me")
async def get_my_investor(
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    user_id = user["sub"]
    investor = _get_investor_by_owner(user_id)
    if not investor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor profile not found for current user")
    return investor


@app.post("/investors", status_code=status.HTTP_201_CREATED)
async def create_investor(
    payload: InvestorCreate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    user_id = user["sub"]
    data = payload.model_dump()
    data["owner_id"] = user_id

    return _save_investor_db(data)


@app.get("/investors/{investor_id}")
async def get_investor(investor_id: str) -> dict[str, Any]:
    investor = _get_investor_db(investor_id)
    if not investor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found")
    return investor


@app.put("/investors/{investor_id}")
async def update_investor(
    investor_id: str,
    payload: InvestorUpdate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    investor = _get_investor_db(investor_id)
    if not investor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found")

    if str(investor.get("owner_id")) != user["sub"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = _update_investor_db(investor_id, update_data)
    return updated or investor


@app.get("/investors/{investor_id}/preferences")
async def get_preferences(investor_id: str) -> dict[str, Any]:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("investment_preferences").select("*").eq("investor_id", investor_id).maybe_single().execute()
            if res.data:
                return res.data
    except Exception:
        pass
    return _PREFERENCES.get(investor_id, {"investor_id": investor_id})


@app.put("/investors/{investor_id}/preferences")
async def update_preferences(
    investor_id: str,
    payload: PreferencesUpdate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    investor = _get_investor_db(investor_id)
    if not investor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found")

    if str(investor.get("owner_id")) != user["sub"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    pref_data = payload.model_dump()
    pref_data["investor_id"] = investor_id
    _PREFERENCES[investor_id] = pref_data

    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            client.table("investment_preferences").upsert(pref_data, on_conflict="investor_id").execute()
    except Exception:
        pass

    return pref_data



@app.get("/investors/{investor_id}/assessment")
async def assessment_placeholder(investor_id: str) -> dict[str, Any]:
    res = _investors_table().select("id").eq("id", investor_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor not found")
    return {
        "investor_id": investor_id,
        "status": "not_run",
        "note": "Wire to AI service investor_analysis workflow",
    }

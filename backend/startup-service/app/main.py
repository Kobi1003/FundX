"""Startup service — profiles, thesis, documents, claims, analysis versions."""

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

SERVICE_NAME = os.getenv("SERVICE_NAME", "startup-service")

app = FastAPI(title="Startup Service", version="0.1.0")


class StartupCreate(BaseModel):
    name: str = Field(..., min_length=1)
    tagline: str | None = None
    description: str | None = None
    industry: str | None = None
    stage: str | None = None
    funding_requirement: float | None = None
    business_model: str | None = None
    website: str | None = None
    thesis: str | None = None


class StartupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    tagline: str | None = None
    description: str | None = None
    industry: str | None = None
    stage: str | None = None
    funding_requirement: float | None = None
    business_model: str | None = None
    website: str | None = None
    thesis: str | None = None


class ThesisUpdate(BaseModel):
    thesis: str = Field(..., min_length=1)


class DocumentMeta(BaseModel):
    filename: str
    doc_type: str | None = None
    storage_path: str | None = None


_STARTUPS: dict[str, dict[str, Any]] = {}


def _get_startup_db(startup_id: str) -> dict[str, Any] | None:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("startups").select("*").eq("id", startup_id).maybe_single().execute()
            if res.data:
                return res.data
    except Exception:
        pass
    return _STARTUPS.get(startup_id)


def _get_startup_by_owner(owner_id: str) -> dict[str, Any] | None:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("startups").select("*").eq("owner_id", owner_id).maybe_single().execute()
            if res.data:
                return res.data
    except Exception:
        pass
    for item in _STARTUPS.values():
        if item.get("owner_id") == owner_id:
            return item
    return None


def _save_startup_db(data: dict[str, Any]) -> dict[str, Any]:
    startup_id = data.get("id") or str(uuid.uuid4())
    data["id"] = startup_id
    _STARTUPS[startup_id] = data
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("startups").insert(data).execute()
            if res.data:
                return res.data[0]
    except Exception:
        pass
    return data


def _update_startup_db(startup_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    if startup_id in _STARTUPS:
        _STARTUPS[startup_id].update(update_data)
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("startups").update(update_data).eq("id", startup_id).execute()
            if res.data:
                return res.data[0]
    except Exception:
        pass
    return _STARTUPS.get(startup_id)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/startups")
async def list_startups() -> list[dict[str, Any]]:
    try:
        client = get_supabase_client(use_service_role=True)
        if client:
            res = client.table("startups").select("*").execute()
            if res.data:
                return res.data
    except Exception:
        pass
    return list(_STARTUPS.values())


@app.get("/startups/me")
async def get_my_startup(
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    user_id = user["sub"]
    startup = _get_startup_by_owner(user_id)
    if not startup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup not found for current user")
    return startup


@app.post("/startups", status_code=status.HTTP_201_CREATED)
async def create_startup(
    payload: StartupCreate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    user_id = user["sub"]
    data = payload.model_dump()
    data["owner_id"] = user_id

    return _save_startup_db(data)


@app.get("/startups/{startup_id}")
async def get_startup(startup_id: str) -> dict[str, Any]:
    startup = _get_startup_db(startup_id)
    if not startup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup not found")
    return startup


@app.put("/startups/{startup_id}")
async def update_startup(
    startup_id: str,
    payload: StartupUpdate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    startup = _get_startup_db(startup_id)
    if not startup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup not found")

    if str(startup.get("owner_id")) != user["sub"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = _update_startup_db(startup_id, update_data)
    return updated or startup



@app.get("/startups/{startup_id}/documents")
async def list_documents(startup_id: str) -> list[dict[str, Any]]:
    client = get_supabase_client(use_service_role=True)
    res = client.table("startup_documents").select("*").eq("startup_id", startup_id).execute()
    return res.data or []


@app.post("/startups/{startup_id}/documents")
async def add_document(
    startup_id: str,
    payload: DocumentMeta,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    res = _startups_table().select("owner_id").eq("id", startup_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup not found")
    if str(res.data.get("owner_id")) != user["sub"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    client = get_supabase_client(use_service_role=True)
    doc_data = {"startup_id": startup_id, **payload.model_dump()}
    doc_res = client.table("startup_documents").insert(doc_data).execute()
    return doc_res.data[0] if doc_res.data else doc_data


@app.get("/startups/{startup_id}/thesis")
async def get_thesis(startup_id: str) -> dict[str, Any]:
    res = _startups_table().select("id, thesis").eq("id", startup_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup not found")
    return {"startup_id": startup_id, "thesis": res.data.get("thesis")}


@app.put("/startups/{startup_id}/thesis")
async def update_thesis(
    startup_id: str,
    payload: ThesisUpdate,
    user: Annotated[dict[str, Any], Depends(require_current_user)],
) -> dict[str, Any]:
    res = _startups_table().select("owner_id").eq("id", startup_id).maybe_single().execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup not found")
    if str(res.data.get("owner_id")) != user["sub"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    _startups_table().update({"thesis": payload.thesis}).eq("id", startup_id).execute()
    return {"startup_id": startup_id, "thesis": payload.thesis}


@app.get("/startups/{startup_id}/analysis")
async def list_analysis(startup_id: str) -> list[dict[str, Any]]:
    client = get_supabase_client(use_service_role=True)
    res = client.table("startup_analysis_runs").select("*").eq("startup_id", startup_id).execute()
    return res.data or []


@app.get("/startups/{startup_id}/claims")
async def list_claims(startup_id: str) -> list[dict[str, Any]]:
    client = get_supabase_client(use_service_role=True)
    res = client.table("startup_claims").select("*").eq("startup_id", startup_id).execute()
    return res.data or []

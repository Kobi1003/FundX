"""Investor service — profile, documents, preferences, AI assessment hooks."""

from __future__ import annotations

import os
import sys
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402

SERVICE_NAME = os.getenv("SERVICE_NAME", "investor-service")

app = FastAPI(title="Investor Service", version="0.1.0")

_INVESTORS: dict[str, dict[str, Any]] = {}
_DOCUMENTS: dict[str, list[dict[str, Any]]] = {}
_PREFERENCES: dict[str, dict[str, Any]] = {}


class InvestorCreate(BaseModel):
    display_name: str = Field(..., min_length=1)
    firm: str | None = None
    bio: str | None = None
    thesis: str | None = None


class PreferencesUpdate(BaseModel):
    industries: list[str] = Field(default_factory=list)
    stages: list[str] = Field(default_factory=list)
    check_size_min: float | None = None
    check_size_max: float | None = None
    geographies: list[str] = Field(default_factory=list)
    notes: str | None = None


class DocumentMeta(BaseModel):
    filename: str
    doc_type: str | None = "cv"
    storage_path: str | None = None


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
    return list(_INVESTORS.values())


@app.post("/investors")
async def create_investor(payload: InvestorCreate) -> dict[str, Any]:
    investor_id = str(uuid.uuid4())
    row = {"id": investor_id, **payload.model_dump()}
    _INVESTORS[investor_id] = row
    _DOCUMENTS[investor_id] = []
    _PREFERENCES[investor_id] = PreferencesUpdate().model_dump()
    return row


@app.get("/investors/{investor_id}")
async def get_investor(investor_id: str) -> dict[str, Any]:
    if investor_id not in _INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    return _INVESTORS[investor_id]


@app.get("/investors/{investor_id}/documents")
async def list_documents(investor_id: str) -> list[dict[str, Any]]:
    if investor_id not in _INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    return _DOCUMENTS.get(investor_id, [])


@app.post("/investors/{investor_id}/documents")
async def add_document(investor_id: str, payload: DocumentMeta) -> dict[str, Any]:
    if investor_id not in _INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    _DOCUMENTS.setdefault(investor_id, []).append(doc)
    return doc


@app.get("/investors/{investor_id}/preferences")
async def get_preferences(investor_id: str) -> dict[str, Any]:
    if investor_id not in _INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    return {"investor_id": investor_id, **_PREFERENCES.get(investor_id, {})}


@app.put("/investors/{investor_id}/preferences")
async def update_preferences(investor_id: str, payload: PreferencesUpdate) -> dict[str, Any]:
    if investor_id not in _INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    _PREFERENCES[investor_id] = payload.model_dump()
    return {"investor_id": investor_id, **payload.model_dump()}


@app.get("/investors/{investor_id}/assessment")
async def assessment_placeholder(investor_id: str) -> dict[str, Any]:
    """Hook for AI background assessment — call ai-service from here later."""
    if investor_id not in _INVESTORS:
        raise HTTPException(status_code=404, detail="Investor not found")
    return {
        "investor_id": investor_id,
        "status": "not_run",
        "note": "Wire to AI service investor_analysis workflow",
    }

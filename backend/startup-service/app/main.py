"""Startup service — profiles, thesis, documents, claims, analysis versions."""

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

SERVICE_NAME = os.getenv("SERVICE_NAME", "startup-service")

app = FastAPI(title="Startup Service", version="0.1.0")

_STARTUPS: dict[str, dict[str, Any]] = {}
_DOCUMENTS: dict[str, list[dict[str, Any]]] = {}
_CLAIMS: dict[str, list[dict[str, Any]]] = {}
_ANALYSIS: dict[str, list[dict[str, Any]]] = {}


class StartupCreate(BaseModel):
    name: str = Field(..., min_length=1)
    tagline: str | None = None
    description: str | None = None
    industry: str | None = None
    stage: str | None = None
    thesis: str | None = None


class ThesisUpdate(BaseModel):
    thesis: str = Field(..., min_length=1)


class DocumentMeta(BaseModel):
    filename: str
    doc_type: str | None = None
    storage_path: str | None = None


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
    return list(_STARTUPS.values())


@app.post("/startups")
async def create_startup(payload: StartupCreate) -> dict[str, Any]:
    startup_id = str(uuid.uuid4())
    row = {"id": startup_id, **payload.model_dump()}
    _STARTUPS[startup_id] = row
    _DOCUMENTS[startup_id] = []
    _CLAIMS[startup_id] = []
    _ANALYSIS[startup_id] = []
    return row


@app.get("/startups/{startup_id}")
async def get_startup(startup_id: str) -> dict[str, Any]:
    if startup_id not in _STARTUPS:
        raise HTTPException(status_code=404, detail="Startup not found")
    return _STARTUPS[startup_id]


@app.get("/startups/{startup_id}/documents")
async def list_documents(startup_id: str) -> list[dict[str, Any]]:
    if startup_id not in _STARTUPS:
        raise HTTPException(status_code=404, detail="Startup not found")
    return _DOCUMENTS.get(startup_id, [])


@app.post("/startups/{startup_id}/documents")
async def add_document(startup_id: str, payload: DocumentMeta) -> dict[str, Any]:
    if startup_id not in _STARTUPS:
        raise HTTPException(status_code=404, detail="Startup not found")
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    _DOCUMENTS.setdefault(startup_id, []).append(doc)
    return doc


@app.get("/startups/{startup_id}/thesis")
async def get_thesis(startup_id: str) -> dict[str, Any]:
    if startup_id not in _STARTUPS:
        raise HTTPException(status_code=404, detail="Startup not found")
    return {"startup_id": startup_id, "thesis": _STARTUPS[startup_id].get("thesis")}


@app.put("/startups/{startup_id}/thesis")
async def update_thesis(startup_id: str, payload: ThesisUpdate) -> dict[str, Any]:
    if startup_id not in _STARTUPS:
        raise HTTPException(status_code=404, detail="Startup not found")
    _STARTUPS[startup_id]["thesis"] = payload.thesis
    return {"startup_id": startup_id, "thesis": payload.thesis}


@app.get("/startups/{startup_id}/analysis")
async def list_analysis(startup_id: str) -> list[dict[str, Any]]:
    if startup_id not in _STARTUPS:
        raise HTTPException(status_code=404, detail="Startup not found")
    return _ANALYSIS.get(startup_id, [])


@app.get("/startups/{startup_id}/claims")
async def list_claims(startup_id: str) -> list[dict[str, Any]]:
    if startup_id not in _STARTUPS:
        raise HTTPException(status_code=404, detail="Startup not found")
    return _CLAIMS.get(startup_id, [])

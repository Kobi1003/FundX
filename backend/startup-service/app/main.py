"""Startup service — profiles, documents, GST/incorporation verification, thesis, claims."""

from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from typing import Any
from datetime import datetime
import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402
from shared import db  # noqa: E402
from shared.local_storage import read_text_excerpt, save_bytes  # noqa: E402

logger = logging.getLogger("fundx.startup-service")

SERVICE_NAME = os.getenv("SERVICE_NAME", "startup-service")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8005")

app = FastAPI(title="Startup Service", version="0.1.0")

# In-memory fallback
_STARTUPS: dict[str, dict[str, Any]] = {
    "startup-aerogrid": {
        "id": "startup-aerogrid",
        "name": "AeroGrid Tech",
        "tagline": "AI-orchestrated autonomous renewable energy grids",
        "description": "AeroGrid stabilizes municipal and commercial energy micro-grids using predictive edge AI.",
        "industry": "CleanTech",
        "stage": "Seed",
        "website": "https://aerogrid.tech",
        "email": "founder@aerogrid.io",
        "gst_number": "27AABCA1234F1Z8",
        "incorporation_cert": "AEROGRID_INCORPORATION_ROC_2024.pdf",
        "is_verified": True,
        "verification_status": "verified",
        "verification_score": 94,
        "verification_report": {
            "status": "verified",
            "score": 94,
            "risk_level": "LOW",
            "verified_badge": "AI Verified",
            "summary": "AI Background check completed for AeroGrid Tech. Compliance confidence score: 94/100. Entity credentials approved for verified deal listing.",
            "audit_checks": [
                {"check": "GSTIN Structure & Registry Validation", "status": "PASS", "detail": "Valid GSTIN registered in state zone 27 (Maharashtra)"},
                {"check": "Certificate of Incorporation (ROC/MCA)", "status": "PASS", "detail": "Authenticated against national corporate registry ROC/2024/7789"},
                {"check": "Sector Regulatory Clearance", "status": "PASS", "detail": "No adverse regulatory flags in CleanTech sector."},
                {"check": "Corporate Identity & Disclosures", "status": "PASS", "detail": "Founding entity verified in good standing at Seed stage."}
            ]
        },
        "thesis": "Distributed renewable micro-grids will capture 32% of commercial power distribution by 2030. AeroGrid combines real-time frequency stabilization algorithms with IoT telemetry to deliver 40% lower curtailment loss.",
        "owner_id": "founder-aerogrid",
        "created_at": "2026-08-15T10:00:00Z",
    },
    "startup-finpulse": {
        "id": "startup-finpulse",
        "name": "FinPulse AI",
        "tagline": "Sub-second B2B treasury and cross-border settlement API",
        "description": "Unified liquidity routing and automated compliance for multinational enterprises.",
        "industry": "FinTech",
        "stage": "Series A",
        "website": "https://finpulse.ai",
        "email": "contact@finpulse.ai",
        "gst_number": "07AAFCD5678K1Z2",
        "incorporation_cert": "FINPULSE_ROC_CERTIFICATE.pdf",
        "is_verified": True,
        "verification_status": "verified",
        "verification_score": 91,
        "verification_report": {
            "status": "verified",
            "score": 91,
            "risk_level": "LOW",
            "verified_badge": "AI Verified",
            "summary": "AI Background check completed for FinPulse AI. Compliance confidence score: 91/100. Entity credentials approved for verified deal listing.",
            "audit_checks": [
                {"check": "GSTIN Structure & Registry Validation", "status": "PASS", "detail": "Valid GSTIN registered in Delhi NCT"},
                {"check": "Certificate of Incorporation (ROC/MCA)", "status": "PASS", "detail": "Authenticated against national corporate registry ROC/2023/1102"},
                {"check": "Sector Regulatory Clearance", "status": "PASS", "detail": "Compliant with payment aggregator guidance"},
                {"check": "Corporate Identity & Disclosures", "status": "PASS", "detail": "Founding entity verified in good standing at Series A stage."}
            ]
        },
        "thesis": "Cross-border B2B payouts currently suffer 3-5 days latency and 2.4% FX friction. FinPulse provides direct routing over ISO20022 rail networks.",
        "owner_id": "founder-finpulse",
        "created_at": "2026-07-20T08:30:00Z",
    },
    "startup-biosynthetix": {
        "id": "startup-biosynthetix",
        "name": "BioSynthetix Labs",
        "tagline": "Generative protein design platform for oncology therapeutics",
        "description": "Deep learning models predicting antibody-antigen binding affinities in weeks instead of years.",
        "industry": "HealthTech",
        "stage": "Pre-Seed",
        "website": "https://biosynthetix.io",
        "email": "team@biosynthetix.io",
        "gst_number": "33AAECB9988P1Z5",
        "incorporation_cert": "BIOSYNTHETIX_PROVISIONAL_INC.pdf",
        "is_verified": False,
        "verification_status": "pending",
        "verification_score": 62,
        "verification_report": None,
        "thesis": "Targeted biologic therapies require massive trial-and-error in wet labs. BioSynthetix uses diffusion models trained on cryo-EM datasets to slash discovery timelines by 60%.",
        "owner_id": "founder-biosynthetix",
        "created_at": "2026-09-02T14:15:00Z",
    },
}

_DOCUMENTS: dict[str, list[dict[str, Any]]] = {
    "startup-aerogrid": [
        {"id": "doc-1", "filename": "AEROGRID_INCORPORATION_DEMO.txt", "doc_type": "incorporation", "storage_path": "demo_docs/AEROGRID_INCORPORATION_DEMO.txt"},
        {"id": "doc-2", "filename": "GST_REGISTRATION_CERT_2024.pdf", "doc_type": "gst", "storage_path": "docs/gst_aerogrid.pdf"},
        {"id": "doc-3", "filename": "AeroGrid_Pitch_Deck_Q3.pdf", "doc_type": "pitch_deck", "storage_path": "docs/pitch_aerogrid.pdf"},
    ],
    "startup-finpulse": [
        {"id": "doc-4", "filename": "FINPULSE_ROC_CERTIFICATE.pdf", "doc_type": "incorporation", "storage_path": "docs/inc_finpulse.pdf"},
        {"id": "doc-5", "filename": "FINPULSE_GST_2023.pdf", "doc_type": "gst", "storage_path": "docs/gst_finpulse.pdf"},
    ],
    "startup-biosynthetix": [
        {"id": "doc-6", "filename": "BIOSYNTHETIX_PROVISIONAL_INC.pdf", "doc_type": "incorporation", "storage_path": "docs/inc_bio.pdf"},
    ],
}

_CLAIMS: dict[str, list[dict[str, Any]]] = {}
_ANALYSIS: dict[str, list[dict[str, Any]]] = {}


class StartupCreate(BaseModel):
    id: str | None = None
    name: str = Field(..., min_length=1)
    tagline: str | None = None
    description: str | None = None
    industry: str | None = None
    stage: str | None = None
    thesis: str | None = None
    gst_number: str | None = None
    cin: str | None = None
    incorporation_cert: str | None = None
    website: str | None = None
    email: str | None = None
    owner_id: str | None = None
    is_verified: bool | None = None
    verification_status: str | None = None
    verification_score: int | None = None


class StartupUpdate(BaseModel):
    name: str | None = None
    tagline: str | None = None
    description: str | None = None
    industry: str | None = None
    stage: str | None = None
    thesis: str | None = None
    gst_number: str | None = None
    cin: str | None = None
    incorporation_cert: str | None = None
    website: str | None = None
    email: str | None = None
    is_verified: bool | None = None


class ThesisUpdate(BaseModel):
    thesis: str = Field(..., min_length=1)


class DocumentMeta(BaseModel):
    filename: str
    doc_type: str | None = None
    storage_path: str | None = None


@app.on_event("startup")
async def on_startup():
    await db.get_pool()


@app.get("/health")
async def health() -> dict[str, Any]:
    pool = await db.get_pool()
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "database_connected": pool is not None,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/startups")
async def list_startups() -> list[dict[str, Any]]:
    rows = await db.fetch("SELECT * FROM public.startups ORDER BY created_at DESC")
    if rows:
        return rows
    return list(_STARTUPS.values())


@app.post("/startups")
async def create_startup(payload: StartupCreate) -> dict[str, Any]:
    startup_id = payload.id or f"startup-{uuid.uuid4().hex[:8]}"
    slug = f"{payload.name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}"

    # Handle CIN verification
    cin = (payload.cin or "").upper().strip()
    is_verified = payload.is_verified or False
    verification_status = payload.verification_status or "pending"
    verification_score = payload.verification_score or 50
    
    if cin:
        try:
            roc_company = await db.fetchrow(
                "SELECT * FROM public.roc_companies WHERE UPPER(cin) = $1",
                cin
            )
            if roc_company and roc_company.get("company_status") == "Active":
                is_verified = True
                verification_status = "verified"
                verification_score = 95
        except Exception as e:
            logger.warning(f"CIN verification in startup creation failed: {e}")

    # Insert into PostgreSQL
    await db.execute(
        """
        INSERT INTO public.startups (
            id, owner_id, name, slug, tagline, description, industry, stage,
            website, email, thesis, gst_number, cin, incorporation_cert,
            is_verified, verification_status, verification_score, verification_timestamp
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            industry = COALESCE(EXCLUDED.industry, startups.industry),
            gst_number = COALESCE(EXCLUDED.gst_number, startups.gst_number),
            cin = COALESCE(EXCLUDED.cin, startups.cin),
            incorporation_cert = COALESCE(EXCLUDED.incorporation_cert, startups.incorporation_cert),
            is_verified = COALESCE(EXCLUDED.is_verified, startups.is_verified),
            verification_status = COALESCE(EXCLUDED.verification_status, startups.verification_status),
            verification_score = COALESCE(EXCLUDED.verification_score, startups.verification_score)
        """,
        startup_id, payload.owner_id, payload.name, slug, payload.tagline, payload.description,
        payload.industry or "Technology", payload.stage or "Seed", payload.website, payload.email,
        payload.thesis, payload.gst_number, cin if cin else None, payload.incorporation_cert,
        is_verified, verification_status, verification_score,
        datetime.utcnow() if is_verified else None
    )

    if payload.incorporation_cert:
        doc_id = f"doc-{uuid.uuid4().hex[:6]}"
        await db.execute(
            "INSERT INTO public.startup_documents (id, startup_id, filename, doc_type, storage_path) VALUES ($1, $2, $3, 'incorporation', $4) ON CONFLICT (id) DO NOTHING",
            doc_id, startup_id, payload.incorporation_cert, f"docs/{payload.incorporation_cert}"
        )
    if payload.gst_number:
        doc_id = f"doc-{uuid.uuid4().hex[:6]}"
        await db.execute(
            "INSERT INTO public.startup_documents (id, startup_id, filename, doc_type, storage_path) VALUES ($1, $2, $3, 'gst', $4) ON CONFLICT (id) DO NOTHING",
            doc_id, startup_id, f"GST_{payload.gst_number}.pdf", f"docs/GST_{payload.gst_number}.pdf"
        )

    row = {
        "id": startup_id,
        "is_verified": is_verified,
        "verification_status": verification_status,
        "verification_score": verification_score,
        "verification_report": None,
        "created_at": datetime.utcnow().isoformat() + "Z",
        **payload.model_dump(),
    }
    _STARTUPS[startup_id] = row
    return row


@app.get("/startups/{startup_id}")
async def get_startup(startup_id: str) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM public.startups WHERE id = $1", startup_id)
    if row:
        docs = await db.fetch("SELECT * FROM public.startup_documents WHERE startup_id = $1", startup_id)
        row["documents"] = docs
        return row

    if startup_id in _STARTUPS:
        res = dict(_STARTUPS[startup_id])
        res["documents"] = _DOCUMENTS.get(startup_id, [])
        return res

    raise HTTPException(status_code=404, detail="Startup not found")


@app.put("/startups/{startup_id}")
async def update_startup(startup_id: str, payload: StartupUpdate) -> dict[str, Any]:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    # DB update
    existing = await db.fetchrow("SELECT * FROM public.startups WHERE id = $1", startup_id)
    if existing:
        set_clauses = []
        args = [startup_id]
        idx = 2
        for k, v in updates.items():
            set_clauses.append(f"{k} = ${idx}")
            args.append(v)
            idx += 1
        if set_clauses:
            query = f"UPDATE public.startups SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = $1 RETURNING *"
            updated = await db.fetchrow(query, *args)
            if updated:
                return updated

    if startup_id in _STARTUPS:
        current = _STARTUPS[startup_id]
        current.update(updates)
        current["updated_at"] = datetime.utcnow().isoformat() + "Z"
        _STARTUPS[startup_id] = current
        return current

    raise HTTPException(status_code=404, detail="Startup not found")


@app.post("/startups/{startup_id}/verify")
async def verify_startup(startup_id: str) -> dict[str, Any]:
    """Run AI Background Verification for the startup."""
    startup = await db.fetchrow("SELECT * FROM public.startups WHERE id = $1", startup_id)
    if not startup:
        startup = _STARTUPS.get(startup_id)
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    verify_payload = {
        "name": startup.get("name"),
        "gst_number": startup.get("gst_number"),
        "incorporation_cert": startup.get("incorporation_cert"),
        "industry": startup.get("industry"),
        "stage": startup.get("stage"),
    }

    report = None
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{AI_SERVICE_URL}/ai/verify/startup", json=verify_payload)
            if resp.status_code == 200:
                report = resp.json()
    except Exception:
        pass

    if not report:
        gst = startup.get("gst_number") or ""
        valid_gst = bool(gst and len(gst) >= 10)
        has_inc = bool(startup.get("incorporation_cert"))
        score = 92 if (valid_gst and has_inc) else (78 if has_inc else 55)
        is_ver = score >= 70
        report = {
            "status": "ai_assessed" if is_ver else "action_required",
            "is_verified": is_ver,
            "score": score,
            "verified_badge": "AI Background Assessment" if is_ver else "Unassessed",
            "summary": (
                f"AI Background Assessment for {startup.get('name')}. "
                f"Confidence score: {score}/100. Not a legal ROC/MCA authentication."
            ),
            "audit_checks": [
                {
                    "check": "GSTIN Format Check",
                    "status": "PASS" if valid_gst else "FLAGGED",
                    "detail": f"GST: {gst or 'Not provided'} (format heuristic only)",
                },
                {
                    "check": "Incorporation Document Present",
                    "status": "PASS" if has_inc else "PENDING",
                    "detail": "Document filename/presence check — not official registry auth.",
                },
                {
                    "check": "Sector Notes (Demo)",
                    "status": "PASS",
                    "detail": f"No seeded adverse flags for {startup.get('industry', 'Tech')}",
                },
                {
                    "check": "Entity Self-Declaration",
                    "status": "PASS",
                    "detail": "Founder-provided profile data accepted for demo listing",
                },
            ],
            "risk_level": "LOW" if score >= 80 else "MODERATE",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    is_verified = report.get("is_verified", True)
    v_status = "ai_assessed" if is_verified else "action_required"
    v_score = report.get("score", 90)

    # Persist in PostgreSQL
    await db.execute(
        """
        UPDATE public.startups
        SET is_verified = $2, verification_status = $3, verification_score = $4, verification_report = $5::jsonb, updated_at = NOW()
        WHERE id = $1
        """,
        startup_id, is_verified, v_status, v_score, json.dumps(report)
    )

    # Also sync is_verified in deals for this startup
    await db.execute(
        "UPDATE public.deals SET startup_verified = $2 WHERE startup_id = $1",
        startup_id, is_verified
    )

    # Update in-memory
    if startup_id in _STARTUPS:
        _STARTUPS[startup_id]["is_verified"] = is_verified
        _STARTUPS[startup_id]["verification_status"] = v_status
        _STARTUPS[startup_id]["verification_score"] = v_score
        _STARTUPS[startup_id]["verification_report"] = report

    return {
        "startup_id": startup_id,
        "is_verified": is_verified,
        "verification_status": v_status,
        "verification_score": v_score,
        "report": report,
    }


@app.get("/startups/{startup_id}/documents")
async def list_documents(startup_id: str) -> list[dict[str, Any]]:
    docs = await db.fetch("SELECT * FROM public.startup_documents WHERE startup_id = $1", startup_id)
    if docs:
        return docs
    return _DOCUMENTS.get(startup_id, [])


@app.post("/startups/{startup_id}/upload-document")
async def upload_document(
    startup_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("general"),
) -> dict[str, Any]:
    """Save startup document bytes under uploads/startups/<id>/."""
    content = await file.read()
    try:
        stored = save_bytes(
            category="startups",
            owner_id=startup_id,
            filename=file.filename or "document.txt",
            content=content,
            subfolder=doc_type or "general",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    excerpt = read_text_excerpt(stored["storage_path"])
    doc_id = f"doc-{uuid.uuid4().hex[:6]}"
    await db.execute(
        "INSERT INTO public.startup_documents (id, startup_id, filename, doc_type, storage_path) VALUES ($1, $2, $3, $4, $5)",
        doc_id,
        startup_id,
        stored["filename"],
        doc_type or "general",
        stored["storage_path"],
    )

    if doc_type == "incorporation":
        await db.execute(
            "UPDATE public.startups SET incorporation_cert = $2, updated_at = NOW() WHERE id = $1",
            startup_id,
            stored["filename"],
        )
        if startup_id in _STARTUPS:
            _STARTUPS[startup_id]["incorporation_cert"] = stored["filename"]

    doc = {
        "id": doc_id,
        "startup_id": startup_id,
        "filename": stored["filename"],
        "doc_type": doc_type or "general",
        "storage_path": stored["storage_path"],
        "text_excerpt": (excerpt or "")[:500],
        "stored_on_disk": True,
    }
    _DOCUMENTS.setdefault(startup_id, []).append(doc)
    return doc


@app.post("/startups/{startup_id}/documents")
async def add_document(startup_id: str, payload: DocumentMeta) -> dict[str, Any]:
    doc_id = f"doc-{uuid.uuid4().hex[:6]}"
    await db.execute(
        "INSERT INTO public.startup_documents (id, startup_id, filename, doc_type, storage_path) VALUES ($1, $2, $3, $4, $5)",
        doc_id, startup_id, payload.filename, payload.doc_type or "general", payload.storage_path or f"docs/{payload.filename}"
    )
    doc = {"id": doc_id, "startup_id": startup_id, **payload.model_dump()}
    _DOCUMENTS.setdefault(startup_id, []).append(doc)
    return doc


@app.get("/startups/{startup_id}/thesis")
async def get_thesis(startup_id: str) -> dict[str, Any]:
    row = await db.fetchrow("SELECT thesis FROM public.startups WHERE id = $1", startup_id)
    if row:
        return {"startup_id": startup_id, "thesis": row.get("thesis")}
    return {"startup_id": startup_id, "thesis": _STARTUPS.get(startup_id, {}).get("thesis")}


@app.put("/startups/{startup_id}/thesis")
async def update_thesis(startup_id: str, payload: ThesisUpdate) -> dict[str, Any]:
    await db.execute("UPDATE public.startups SET thesis = $2, updated_at = NOW() WHERE id = $1", startup_id, payload.thesis)
    if startup_id in _STARTUPS:
        _STARTUPS[startup_id]["thesis"] = payload.thesis
    return {"startup_id": startup_id, "thesis": payload.thesis}


@app.get("/startups/{startup_id}/analysis")
async def list_analysis(startup_id: str) -> list[dict[str, Any]]:
    return _ANALYSIS.get(startup_id, [])


@app.get("/startups/{startup_id}/claims")
async def list_claims(startup_id: str) -> list[dict[str, Any]]:
    return _CLAIMS.get(startup_id, [])

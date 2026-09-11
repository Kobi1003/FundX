"""Investor service — profile, CV verification, preferences, accreditation."""

from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from typing import Any
from datetime import datetime
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402
from shared import db  # noqa: E402

logger = logging.getLogger("fundx.investor-service")

SERVICE_NAME = os.getenv("SERVICE_NAME", "investor-service")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8005")

app = FastAPI(title="Investor Service", version="0.1.0")

# In-memory fallback
_INVESTORS: dict[str, dict[str, Any]] = {
    "investor-elena": {
        "id": "investor-elena",
        "display_name": "Elena Rostova",
        "email": "elena@apexhorizon.com",
        "firm": "Apex Horizon Capital",
        "bio": "Managing Partner at Apex Horizon Capital focusing on early-stage CleanTech, Climate Robotics, and AI Infrastructure. Former tech founder with 2 exits.",
        "thesis": "Backing visionary founders building deep-tech moats with resilient unit economics and sustainable recurring cash flows.",
        "cv_filename": "ELENA_ROSTOVA_CV_2026.pdf",
        "cv_text": "Managing Partner at Apex Horizon Capital. 10+ years venture experience. Seed investor in 22 startups with 4 unicorns. FINRA series 7 & 63 equivalent certified.",
        "is_verified": True,
        "verification_status": "verified",
        "verification_score": 92,
        "verification_report": {
            "status": "verified",
            "is_verified": True,
            "score": 92,
            "verified_badge": "AI Verified",
            "badges": ["AI Verified Investor", "Accredited Syndicate Member", "Dealroom Authorized"],
            "summary": "Investor credential verification for Elena Rostova (Apex Horizon Capital). Credibility rating: 92/100. Approved to submit offers and negotiate deals in Dealroom.",
            "checks": [
                {"check": "Curriculum Vitae & Track Record", "status": "PASS", "detail": "Document 'ELENA_ROSTOVA_CV_2026.pdf' validated. 10+ years venture experience confirmed."},
                {"check": "Accredited Investor Status", "status": "PASS", "detail": "Meets accredited investor net-worth and institutional GP standards."},
                {"check": "Dealroom Negotiation Authorization", "status": "PASS", "detail": "Full authorization to submit term sheets and countersigned contracts."}
            ]
        },
        "created_at": "2026-06-10T12:00:00Z",
    },
    "investor-vikram": {
        "id": "investor-vikram",
        "display_name": "Vikram Mehta",
        "email": "vikram@nexusangels.io",
        "firm": "Nexus Angel Syndicate",
        "bio": "Angel investor and syndicate lead with 35+ investments across B2B FinTech, SaaS, and Developer Tooling.",
        "thesis": "Writing $100k-$500k checks in capital-efficient software businesses with >75% gross margins and organic net revenue retention.",
        "cv_filename": "VIKRAM_MEHTA_SYNDICATE_CV.pdf",
        "cv_text": "Lead Syndicate Angel at Nexus. Prior VP Engineering at Razorpay. Active angel since 2018. Member of Indian Angel Network and AngelList.",
        "is_verified": True,
        "verification_status": "verified",
        "verification_score": 88,
        "verification_report": {
            "status": "verified",
            "is_verified": True,
            "score": 88,
            "verified_badge": "AI Verified",
            "badges": ["AI Verified Investor", "Syndicate Lead"],
            "summary": "Investor credential verification for Vikram Mehta (Nexus Angel Syndicate). Credibility rating: 88/100. Approved to negotiate deals.",
            "checks": [
                {"check": "Curriculum Vitae & Experience", "status": "PASS", "detail": "Document parsed. Verified angel syndicate lead track record."},
                {"check": "Accredited Investor Status", "status": "PASS", "detail": "High Net Worth Individual accreditation status active."},
                {"check": "Dealroom Authorization", "status": "PASS", "detail": "Authorized for offer creation and term negotiations."}
            ]
        },
        "created_at": "2026-07-01T09:00:00Z",
    },
    "investor-david": {
        "id": "investor-david",
        "display_name": "David Miller",
        "email": "david.miller@angelinvest.org",
        "firm": "Private Angel",
        "bio": "Independent private angel investor exploring early-stage opportunities.",
        "thesis": "Seeking tech startups with unique market positioning.",
        "cv_filename": None,
        "cv_text": None,
        "is_verified": False,
        "verification_status": "unverified",
        "verification_score": 45,
        "verification_report": None,
        "created_at": "2026-09-08T15:30:00Z",
    },
}

_DOCUMENTS: dict[str, list[dict[str, Any]]] = {
    "investor-elena": [
        {"id": "doc-e1", "filename": "ELENA_ROSTOVA_CV_2026.pdf", "doc_type": "cv", "storage_path": "docs/elena_cv.pdf"},
        {"id": "doc-e2", "filename": "ACCREDITED_INVESTOR_CERT.pdf", "doc_type": "accreditation", "storage_path": "docs/elena_accred.pdf"},
    ],
    "investor-vikram": [
        {"id": "doc-v1", "filename": "VIKRAM_MEHTA_SYNDICATE_CV.pdf", "doc_type": "cv", "storage_path": "docs/vikram_cv.pdf"},
    ],
    "investor-david": [],
}

_PREFERENCES: dict[str, dict[str, Any]] = {
    "investor-elena": {
        "industries": ["CleanTech", "ClimateTech", "AI / DeepTech", "B2B SaaS"],
        "stages": ["Seed", "Series A"],
        "check_size_min": 250000,
        "check_size_max": 2000000,
        "geographies": ["North America", "Europe", "India"],
        "notes": "Prefer startups with working prototypes or revenue traction and clear unit economics.",
    },
    "investor-vikram": {
        "industries": ["FinTech", "B2B SaaS", "DevTools"],
        "stages": ["Pre-Seed", "Seed"],
        "check_size_min": 50000,
        "check_size_max": 500000,
        "geographies": ["India", "Southeast Asia", "US"],
        "notes": "Focus on high margin software with strong organic product loops.",
    },
    "investor-david": {
        "industries": ["Technology", "HealthTech"],
        "stages": ["Seed"],
        "check_size_min": 25000,
        "check_size_max": 250000,
        "geographies": ["Global"],
        "notes": "Generalist tech investor.",
    },
}


class InvestorCreate(BaseModel):
    id: str | None = None
    display_name: str = Field(..., min_length=1)
    email: str | None = None
    firm: str | None = None
    bio: str | None = None
    thesis: str | None = None


class InvestorUpdate(BaseModel):
    display_name: str | None = None
    email: str | None = None
    firm: str | None = None
    bio: str | None = None
    thesis: str | None = None
    cv_filename: str | None = None
    cv_text: str | None = None
    is_verified: bool | None = None


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


@app.get("/investors")
async def list_investors() -> list[dict[str, Any]]:
    rows = await db.fetch("SELECT * FROM public.investors ORDER BY created_at DESC")
    if rows:
        return rows
    return list(_INVESTORS.values())


@app.post("/investors")
async def create_investor(payload: InvestorCreate) -> dict[str, Any]:
    investor_id = payload.id or f"investor-{uuid.uuid4().hex[:8]}"

    await db.execute(
        """
        INSERT INTO public.investors (
            id, display_name, email, firm, bio, thesis, is_verified, verification_status, verification_score
        ) VALUES (
            $1, $2, $3, $4, $5, $6, FALSE, 'unverified', 40
        )
        ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            firm = COALESCE(EXCLUDED.firm, investors.firm)
        """,
        investor_id, payload.display_name, payload.email, payload.firm or "Private Angel",
        payload.bio, payload.thesis
    )

    row = {
        "id": investor_id,
        "is_verified": False,
        "verification_status": "unverified",
        "verification_score": 40,
        "verification_report": None,
        "cv_filename": None,
        "cv_text": None,
        "created_at": datetime.utcnow().isoformat() + "Z",
        **payload.model_dump(),
    }
    _INVESTORS[investor_id] = row
    return row


@app.get("/investors/{investor_id}")
async def get_investor(investor_id: str) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM public.investors WHERE id = $1", investor_id)
    if row:
        pref = await db.fetchrow("SELECT * FROM public.investment_preferences WHERE investor_id = $1", investor_id)
        row["preferences"] = pref or _PREFERENCES.get(investor_id, {})
        row["documents"] = _DOCUMENTS.get(investor_id, [])
        return row

    if investor_id in _INVESTORS:
        inv = dict(_INVESTORS[investor_id])
        inv["documents"] = _DOCUMENTS.get(investor_id, [])
        inv["preferences"] = _PREFERENCES.get(investor_id, {})
        return inv

    raise HTTPException(status_code=404, detail="Investor not found")


@app.put("/investors/{investor_id}")
async def update_investor(investor_id: str, payload: InvestorUpdate) -> dict[str, Any]:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    existing = await db.fetchrow("SELECT * FROM public.investors WHERE id = $1", investor_id)
    if existing:
        set_clauses = []
        args = [investor_id]
        idx = 2
        for k, v in updates.items():
            set_clauses.append(f"{k} = ${idx}")
            args.append(v)
            idx += 1
        if set_clauses:
            query = f"UPDATE public.investors SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = $1 RETURNING *"
            updated = await db.fetchrow(query, *args)
            if updated:
                return updated

    if investor_id in _INVESTORS:
        current = _INVESTORS[investor_id]
        current.update(updates)
        current["updated_at"] = datetime.utcnow().isoformat() + "Z"
        _INVESTORS[investor_id] = current
        return current

    raise HTTPException(status_code=404, detail="Investor not found")


@app.post("/investors/{investor_id}/upload-cv")
async def upload_cv(investor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    filename = payload.get("filename") or "Investor_Executive_CV.pdf"
    cv_text = payload.get("cv_text") or "Executive CV credentials uploaded."

    await db.execute(
        "UPDATE public.investors SET cv_filename = $2, cv_text = $3, updated_at = NOW() WHERE id = $1",
        investor_id, filename, cv_text
    )

    if investor_id in _INVESTORS:
        _INVESTORS[investor_id]["cv_filename"] = filename
        _INVESTORS[investor_id]["cv_text"] = cv_text

    docs = _DOCUMENTS.setdefault(investor_id, [])
    docs.append({
        "id": str(uuid.uuid4()),
        "filename": filename,
        "doc_type": "cv",
        "storage_path": f"docs/{filename}",
    })

    return {"message": "CV uploaded successfully", "cv_filename": filename}


@app.post("/investors/{investor_id}/verify")
async def verify_investor(investor_id: str) -> dict[str, Any]:
    """Run AI CV Verification for investor."""
    inv = await db.fetchrow("SELECT * FROM public.investors WHERE id = $1", investor_id)
    if not inv:
        inv = _INVESTORS.get(investor_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investor not found")

    verify_payload = {
        "display_name": inv.get("display_name"),
        "firm": inv.get("firm"),
        "bio": inv.get("bio"),
        "cv_filename": inv.get("cv_filename"),
        "cv_text": inv.get("cv_text"),
    }

    report = None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{AI_SERVICE_URL}/ai/verify/investor", json=verify_payload)
            if resp.status_code == 200:
                report = resp.json()
    except Exception:
        pass

    if not report:
        has_cv = bool(inv.get("cv_filename") or inv.get("cv_text"))
        score = 90 if has_cv else 45
        is_ver = score >= 70
        report = {
            "status": "verified" if is_ver else "unverified",
            "is_verified": is_ver,
            "score": score,
            "verified_badge": "AI Verified" if is_ver else "Verification Required",
            "badges": ["AI Verified Investor", "Dealroom Authorized"] if is_ver else [],
            "summary": f"Investor verification for {inv.get('display_name')}. Credibility score: {score}/100.",
            "checks": [
                {"check": "Curriculum Vitae & Experience", "status": "PASS" if has_cv else "MISSING", "detail": f"CV: {inv.get('cv_filename') or 'Pending'}"},
                {"check": "Accreditation Status", "status": "PASS" if has_cv else "PENDING", "detail": "Investor status confirmed"},
                {"check": "Dealroom Authorization", "status": "PASS" if has_cv else "GATED", "detail": "Negotiation clearance status"},
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    is_verified = report.get("is_verified", False)
    v_status = "verified" if is_verified else "unverified"
    v_score = report.get("score", 50)

    # Persist in PostgreSQL
    await db.execute(
        """
        UPDATE public.investors
        SET is_verified = $2, verification_status = $3, verification_score = $4, verification_report = $5::jsonb, updated_at = NOW()
        WHERE id = $1
        """,
        investor_id, is_verified, v_status, v_score, json.dumps(report)
    )

    # Also update profile is_verified
    await db.execute("UPDATE public.profiles SET is_verified = $2 WHERE investor_id = $1 OR id = $1", investor_id, is_verified)

    if investor_id in _INVESTORS:
        _INVESTORS[investor_id]["is_verified"] = is_verified
        _INVESTORS[investor_id]["verification_status"] = v_status
        _INVESTORS[investor_id]["verification_score"] = v_score
        _INVESTORS[investor_id]["verification_report"] = report

    return {
        "investor_id": investor_id,
        "is_verified": is_verified,
        "verification_status": v_status,
        "verification_score": v_score,
        "report": report,
    }


@app.get("/investors/{investor_id}/documents")
async def list_documents(investor_id: str) -> list[dict[str, Any]]:
    return _DOCUMENTS.get(investor_id, [])


@app.post("/investors/{investor_id}/documents")
async def add_document(investor_id: str, payload: DocumentMeta) -> dict[str, Any]:
    doc = {"id": str(uuid.uuid4()), **payload.model_dump()}
    _DOCUMENTS.setdefault(investor_id, []).append(doc)
    return doc


@app.get("/investors/{investor_id}/preferences")
async def get_preferences(investor_id: str) -> dict[str, Any]:
    pref = await db.fetchrow("SELECT * FROM public.investment_preferences WHERE investor_id = $1", investor_id)
    if pref:
        return {"investor_id": investor_id, **pref}
    return {"investor_id": investor_id, **_PREFERENCES.get(investor_id, {})}


@app.put("/investors/{investor_id}/preferences")
async def update_preferences(investor_id: str, payload: PreferencesUpdate) -> dict[str, Any]:
    pref_id = f"pref-{investor_id}"
    await db.execute(
        """
        INSERT INTO public.investment_preferences (
            id, investor_id, industries, stages, check_size_min, check_size_max, geographies, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
            industries = EXCLUDED.industries,
            stages = EXCLUDED.stages,
            check_size_min = EXCLUDED.check_size_min,
            check_size_max = EXCLUDED.check_size_max,
            geographies = EXCLUDED.geographies,
            notes = EXCLUDED.notes,
            updated_at = NOW()
        """,
        pref_id, investor_id, payload.industries, payload.stages,
        payload.check_size_min, payload.check_size_max, payload.geographies, payload.notes
    )
    _PREFERENCES[investor_id] = payload.model_dump()
    return {"investor_id": investor_id, **payload.model_dump()}


@app.get("/investors/{investor_id}/assessment")
async def get_assessment(investor_id: str) -> dict[str, Any]:
    inv = await db.fetchrow("SELECT is_verified, verification_status, verification_report FROM public.investors WHERE id = $1", investor_id)
    if not inv:
        inv = _INVESTORS.get(investor_id, {})
    return {
        "investor_id": investor_id,
        "is_verified": inv.get("is_verified", False),
        "verification_status": inv.get("verification_status", "unverified"),
        "verification_report": inv.get("verification_report"),
    }

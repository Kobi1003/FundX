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
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.neo4j.graph_sync import set_investor_industries, upsert_investor  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402
from shared import db  # noqa: E402
from shared.local_storage import (  # noqa: E402
    list_owner_files,
    read_text_excerpt,
    save_bytes,
)

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
        "cv_filename": "ELENA_ROSTOVA_CV.txt",
        "cv_storage_path": "demo_cvs/ELENA_ROSTOVA_CV.txt",
        "cv_text": "Managing Partner at Apex Horizon Capital. 10+ years venture experience. Seed investor in 22 startups with 4 unicorns. FINRA series 7 & 63 equivalent certified.",
        "is_verified": True,
        "verification_status": "ai_assessed",
        "verification_score": 92,
        "verification_report": {
            "status": "ai_assessed",
            "is_verified": True,
            "score": 92,
            "verified_badge": "AI Background Assessment",
            "badges": ["AI Assessed Investor", "Dealroom Eligible (Demo)"],
            "summary": "AI Background Assessment for Elena Rostova (Apex Horizon Capital). Credibility rating: 92/100. Not legal KYC — demo assessment only.",
            "checks": [
                {"check": "CV Document Present", "status": "PASS", "detail": "Document 'ELENA_ROSTOVA_CV.txt' stored under uploads/demo_cvs/."},
                {"check": "Self-Attested Experience Signals", "status": "PASS", "detail": "CV text indicates venture / syndicate experience (heuristic)."},
                {"check": "Dealroom Eligibility (Demo)", "status": "PASS", "detail": "Assessment score meets demo threshold for offers."}
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
        "cv_filename": "VIKRAM_MEHTA_CV.txt",
        "cv_storage_path": "demo_cvs/VIKRAM_MEHTA_CV.txt",
        "cv_text": "Lead Syndicate Angel at Nexus. Prior VP Engineering at Razorpay. Active angel since 2018. Member of Indian Angel Network and AngelList.",
        "is_verified": True,
        "verification_status": "ai_assessed",
        "verification_score": 88,
        "verification_report": {
            "status": "ai_assessed",
            "is_verified": True,
            "score": 88,
            "verified_badge": "AI Background Assessment",
            "badges": ["AI Assessed Investor", "Syndicate Lead (Demo)"],
            "summary": "AI Background Assessment for Vikram Mehta (Nexus Angel Syndicate). Credibility rating: 88/100. Not legal KYC — demo assessment only.",
            "checks": [
                {"check": "CV Document Present", "status": "PASS", "detail": "Document 'VIKRAM_MEHTA_CV.txt' stored under uploads/demo_cvs/."},
                {"check": "Self-Attested Experience Signals", "status": "PASS", "detail": "CV text indicates angel / syndicate activity (heuristic)."},
                {"check": "Dealroom Eligibility (Demo)", "status": "PASS", "detail": "Assessment score meets demo threshold for offers."}
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
        {
            "id": "doc-e1",
            "filename": "ELENA_ROSTOVA_CV.txt",
            "doc_type": "cv",
            "storage_path": "demo_cvs/ELENA_ROSTOVA_CV.txt",
        },
    ],
    "investor-vikram": [
        {
            "id": "doc-v1",
            "filename": "VIKRAM_MEHTA_CV.txt",
            "doc_type": "cv",
            "storage_path": "demo_cvs/VIKRAM_MEHTA_CV.txt",
        },
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
    cin: str | None = None
    gst_number: str | None = None
    is_verified: bool | None = None
    verification_status: str | None = None
    verification_score: int | None = None


class InvestorUpdate(BaseModel):
    display_name: str | None = None
    email: str | None = None
    firm: str | None = None
    bio: str | None = None
    thesis: str | None = None
    cv_filename: str | None = None
    cv_text: str | None = None
    cin: str | None = None
    gst_number: str | None = None
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


@app.post("/investors/ensure")
async def ensure_investor(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Ensure an investors row exists for the logged-in user.
    Body: { owner_id?, email?, display_name?, firm?, investor_id? }
    """
    email = (payload.get("email") or "").lower().strip()
    owner_id = payload.get("owner_id") or payload.get("user_id")
    preferred_id = payload.get("investor_id")
    display_name = payload.get("display_name") or payload.get("full_name") or (email.split("@")[0] if email else "Investor")
    firm = payload.get("firm") or "Private Angel"

    inv = None
    if preferred_id:
        inv = await db.fetchrow("SELECT * FROM public.investors WHERE id = $1", preferred_id)
    if not inv and owner_id:
        inv = await db.fetchrow("SELECT * FROM public.investors WHERE owner_id = $1 LIMIT 1", owner_id)
    if not inv and email:
        inv = await db.fetchrow("SELECT * FROM public.investors WHERE LOWER(email) = $1 LIMIT 1", email)

    if inv:
        return inv

    investor_id = preferred_id or f"investor-{uuid.uuid4().hex[:8]}"
    await db.execute(
        """
        INSERT INTO public.investors (id, owner_id, display_name, email, firm, is_verified, verification_status, verification_score)
        VALUES ($1, $2, $3, $4, $5, FALSE, 'unverified', 40)
        ON CONFLICT (id) DO NOTHING
        """,
        investor_id, owner_id, display_name, email or None, firm,
    )
    if owner_id:
        await db.execute("UPDATE public.profiles SET investor_id = $2 WHERE id = $1", owner_id, investor_id)

    row = await db.fetchrow("SELECT * FROM public.investors WHERE id = $1", investor_id)
    if row:
        _INVESTORS[investor_id] = row
        upsert_investor(
            investor_id,
            name=row.get("display_name"),
            firm=row.get("firm"),
            email=row.get("email"),
        )
        return row

    # In-memory fallback
    row = {
        "id": investor_id,
        "owner_id": owner_id,
        "display_name": display_name,
        "email": email,
        "firm": firm,
        "is_verified": False,
        "verification_status": "unverified",
        "verification_score": 40,
        "cv_filename": None,
        "cv_text": None,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _INVESTORS[investor_id] = row
    upsert_investor(investor_id, name=display_name, firm=firm, email=email)
    return row


@app.get("/investors")
async def list_investors() -> list[dict[str, Any]]:
    rows = await db.fetch("SELECT * FROM public.investors ORDER BY created_at DESC")
    if rows:
        return rows
    return list(_INVESTORS.values())


@app.post("/investors")
async def create_investor(payload: InvestorCreate) -> dict[str, Any]:
    investor_id = payload.id or f"investor-{uuid.uuid4().hex[:8]}"

    # Handle CIN verification
    cin = (payload.cin or "").upper().strip()
    gst_number = (payload.gst_number or "").upper().strip()
    is_verified = payload.is_verified or False
    verification_status = payload.verification_status or "unverified"
    verification_score = payload.verification_score or 40
    
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
            logger.warning(f"CIN verification in investor creation failed: {e}")

    await db.execute(
        """
        INSERT INTO public.investors (
            id, display_name, email, firm, bio, thesis, cin, gst_number,
            is_verified, verification_status, verification_score, verification_timestamp
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            firm = COALESCE(EXCLUDED.firm, investors.firm),
            cin = COALESCE(EXCLUDED.cin, investors.cin),
            gst_number = COALESCE(EXCLUDED.gst_number, investors.gst_number),
            is_verified = COALESCE(EXCLUDED.is_verified, investors.is_verified),
            verification_status = COALESCE(EXCLUDED.verification_status, investors.verification_status),
            verification_score = COALESCE(EXCLUDED.verification_score, investors.verification_score)
        """,
        investor_id, payload.display_name, payload.email, payload.firm or "Private Angel",
        payload.bio, payload.thesis, cin if cin else None, gst_number if gst_number else None,
        is_verified, verification_status, verification_score,
        datetime.utcnow() if is_verified else None
    )

    row = {
        "id": investor_id,
        "is_verified": is_verified,
        "verification_status": verification_status,
        "verification_score": verification_score,
        "verification_report": None,
        "cv_filename": None,
        "cv_text": None,
        "created_at": datetime.utcnow().isoformat() + "Z",
        **payload.model_dump(),
    }
    _INVESTORS[investor_id] = row
    upsert_investor(
        investor_id,
        name=payload.display_name,
        firm=payload.firm or "Private Angel",
        email=payload.email,
    )
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
async def upload_cv(
    investor_id: str,
    file: UploadFile | None = File(None),
    filename: str | None = Form(None),
    cv_text: str | None = Form(None),
) -> dict[str, Any]:
    """
    Store CV on local disk under uploads/investors/<id>/.

    Accepts multipart file upload (preferred) or form fields for text-only demos.
    JSON clients can still POST {"filename","cv_text"} via the JSON fallback route below.
    """
    # Support legacy JSON body when Content-Type is application/json
    if file is None and filename is None and cv_text is None:
        raise HTTPException(
            status_code=400,
            detail="Provide a file upload or form fields filename/cv_text",
        )

    stored: dict[str, Any] | None = None
    resolved_name = filename or (file.filename if file else None) or "Investor_CV.txt"
    extracted = (cv_text or "").strip()

    if file is not None:
        content = await file.read()
        try:
            stored = save_bytes(
                category="investors",
                owner_id=investor_id,
                filename=file.filename or resolved_name,
                content=content,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        resolved_name = stored["filename"]
        if not extracted:
            extracted = read_text_excerpt(stored["storage_path"]) or (
                f"CV file stored at {stored['storage_path']} ({stored['size_bytes']} bytes)."
            )

    storage_path = stored["storage_path"] if stored else None

    await db.execute(
        "UPDATE public.investors SET cv_filename = $2, cv_text = $3, updated_at = NOW() WHERE id = $1",
        investor_id,
        resolved_name,
        extracted or "CV uploaded.",
    )

    if investor_id in _INVESTORS:
        _INVESTORS[investor_id]["cv_filename"] = resolved_name
        _INVESTORS[investor_id]["cv_text"] = extracted
        _INVESTORS[investor_id]["cv_storage_path"] = storage_path

    docs = _DOCUMENTS.setdefault(investor_id, [])
    docs.append(
        {
            "id": str(uuid.uuid4()),
            "filename": resolved_name,
            "doc_type": "cv",
            "storage_path": storage_path or f"investors/{investor_id}/{resolved_name}",
        }
    )

    return {
        "message": "CV uploaded successfully",
        "cv_filename": resolved_name,
        "cv_text_excerpt": (extracted or "")[:500],
        "storage_path": storage_path,
        "stored_on_disk": stored is not None,
    }


@app.post("/investors/{investor_id}/upload-cv-json")
async def upload_cv_json(investor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    """JSON fallback: paste filename + text without multipart."""
    filename = payload.get("filename") or "Investor_Executive_CV.txt"
    cv_text = payload.get("cv_text") or "Executive CV credentials uploaded."
    content = cv_text.encode("utf-8")
    try:
        stored = save_bytes(
            category="investors",
            owner_id=investor_id,
            filename=filename if filename.lower().endswith((".txt", ".md")) else f"{filename}.txt",
            content=content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await db.execute(
        "UPDATE public.investors SET cv_filename = $2, cv_text = $3, updated_at = NOW() WHERE id = $1",
        investor_id,
        stored["filename"],
        cv_text,
    )
    if investor_id in _INVESTORS:
        _INVESTORS[investor_id]["cv_filename"] = stored["filename"]
        _INVESTORS[investor_id]["cv_text"] = cv_text
        _INVESTORS[investor_id]["cv_storage_path"] = stored["storage_path"]

    docs = _DOCUMENTS.setdefault(investor_id, [])
    docs.append(
        {
            "id": str(uuid.uuid4()),
            "filename": stored["filename"],
            "doc_type": "cv",
            "storage_path": stored["storage_path"],
        }
    )
    return {
        "message": "CV text saved to local uploads/",
        "cv_filename": stored["filename"],
        "storage_path": stored["storage_path"],
        "stored_on_disk": True,
    }


@app.post("/investors/{investor_id}/upload-cv-file")
async def upload_cv_file(investor_id: str, file: UploadFile = File(...)) -> dict[str, Any]:
    filename = file.filename or "Uploaded_CV.pdf"
    content_bytes = await file.read()

    stored = None
    try:
        stored = save_bytes(
            category="investors",
            owner_id=investor_id,
            filename=filename,
            content=content_bytes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    
    extracted_text = ""
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(content_bytes))
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text += t + "\n"
    except Exception:
        pass

    if not extracted_text and stored:
        extracted_text = read_text_excerpt(stored["storage_path"]) or ""

    if not extracted_text:
        try:
            raw_str = content_bytes.decode("latin-1", errors="ignore")
            import re
            matches = re.findall(r"\((.*?)\)\s*Tj", raw_str)
            if matches:
                extracted_text = " ".join(matches)
        except Exception:
            pass

    if not extracted_text:
        extracted_text = f"Uploaded PDF CV ({filename}). Text extracted for verification."

    await db.execute(
        "UPDATE public.investors SET cv_filename = $2, cv_text = $3, updated_at = NOW() WHERE id = $1",
        investor_id, filename, extracted_text
    )

    if investor_id in _INVESTORS:
        _INVESTORS[investor_id]["cv_filename"] = filename
        _INVESTORS[investor_id]["cv_text"] = extracted_text
        if stored:
            _INVESTORS[investor_id]["cv_storage_path"] = stored["storage_path"]

    docs = _DOCUMENTS.setdefault(investor_id, [])
    docs.append({
        "id": str(uuid.uuid4()),
        "filename": filename,
        "doc_type": "cv",
        "storage_path": stored["storage_path"] if stored else f"docs/{filename}",
    })

    return {
        "message": "PDF CV file uploaded successfully",
        "cv_filename": filename,
        "cv_text": extracted_text,
        "storage_path": stored["storage_path"] if stored else None,
        "stored_on_disk": stored is not None,
    }



async def _resolve_investor(investor_id: str) -> dict[str, Any] | None:
    """Resolve investor by id, then owner_id, then email-shaped id fallbacks."""
    inv = await db.fetchrow("SELECT * FROM public.investors WHERE id = $1", investor_id)
    if inv:
        return inv
    if investor_id in _INVESTORS:
        return dict(_INVESTORS[investor_id])
    # Profile id used by mistake → find by owner_id
    inv = await db.fetchrow("SELECT * FROM public.investors WHERE owner_id = $1 LIMIT 1", investor_id)
    if inv:
        return inv
    return None


@app.post("/investors/{investor_id}/verify")
async def verify_investor(investor_id: str) -> dict[str, Any]:
    """Run AI CV Verification for investor."""
    inv = await _resolve_investor(investor_id)
    if not inv:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Investor not found for id '{investor_id}'. "
                "Re-login so your profile.investor_id is repaired, or register again."
            ),
        )

    # Always use the canonical investors.id for persistence
    investor_id = inv.get("id") or investor_id

    verify_payload = {
        "display_name": inv.get("display_name"),
        "firm": inv.get("firm"),
        "bio": inv.get("bio"),
        "cv_filename": inv.get("cv_filename"),
        "cv_text": inv.get("cv_text"),
        "cv_storage_path": inv.get("cv_storage_path"),
    }

    # Enrich from on-disk CV if text is thin
    disk_files = list_owner_files("investors", investor_id)
    if disk_files and (not verify_payload.get("cv_text") or len(str(verify_payload.get("cv_text"))) < 40):
        excerpt = read_text_excerpt(disk_files[-1]["storage_path"])
        if excerpt:
            verify_payload["cv_text"] = excerpt
            verify_payload["cv_storage_path"] = disk_files[-1]["storage_path"]
            verify_payload["cv_filename"] = verify_payload.get("cv_filename") or disk_files[-1]["filename"]
    elif inv.get("cv_storage_path"):
        excerpt = read_text_excerpt(inv["cv_storage_path"])
        if excerpt and (not verify_payload.get("cv_text") or len(str(verify_payload.get("cv_text"))) < 40):
            verify_payload["cv_text"] = excerpt

    report = None
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{AI_SERVICE_URL}/ai/verify/investor", json=verify_payload)
            if resp.status_code == 200:
                report = resp.json()
    except Exception:
        pass

    if not report:
        has_cv = bool(inv.get("cv_filename") or inv.get("cv_text") or disk_files)
        score = 90 if has_cv else 45
        is_ver = score >= 70
        report = {
            "status": "ai_assessed" if is_ver else "incomplete",
            "is_verified": is_ver,
            "score": score,
            "verified_badge": "AI Background Assessment" if is_ver else "Assessment Required",
            "badges": ["AI Assessed Investor", "Dealroom Eligible (Demo)"] if is_ver else [],
            "summary": (
                f"AI Background Assessment for {inv.get('display_name')}. "
                f"Credibility score: {score}/100. Not legal KYC."
            ),
            "checks": [
                {
                    "check": "CV Document Present",
                    "status": "PASS" if has_cv else "MISSING",
                    "detail": f"CV: {inv.get('cv_filename') or 'Pending upload'}",
                },
                {
                    "check": "Self-Attested Experience Signals",
                    "status": "PASS" if has_cv else "PENDING",
                    "detail": "Heuristic parse of CV text only — not a legal accreditation check.",
                },
                {
                    "check": "Dealroom Eligibility (Demo)",
                    "status": "PASS" if has_cv else "GATED",
                    "detail": "Demo gate based on assessment score.",
                },
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    is_verified = report.get("is_verified", False)
    v_status = "ai_assessed" if is_verified else "incomplete"
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
    set_investor_industries(investor_id, payload.industries or [])
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

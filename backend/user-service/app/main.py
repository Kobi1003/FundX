"""User service — profiles, registration, authentication and roles."""

from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from typing import Annotated, Any
from datetime import datetime
import httpx
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.auth import optional_current_user, require_current_user  # noqa: E402
from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402
from shared import db  # noqa: E402
from shared.migrations import run_migrations  # noqa: E402
from shared.gst_verify import verify_gstin  # noqa: E402
from shared.company_masterdata import seed_roc_companies_from_masterdata  # noqa: E402

logger = logging.getLogger("fundx.user-service")

SERVICE_NAME = os.getenv("SERVICE_NAME", "user-service")
STARTUP_SERVICE_URL = os.getenv("STARTUP_SERVICE_URL", "http://startup-service:8002")
INVESTOR_SERVICE_URL = os.getenv("INVESTOR_SERVICE_URL", "http://investor-service:8003")

app = FastAPI(title="User Service", version="0.1.0")

# In-memory fallback
_PROFILES: dict[str, dict[str, Any]] = {
    "admin-user": {
        "id": "admin-user",
        "full_name": "FundX Platform Super Admin",
        "email": "admin@fundx.ai",
        "role": "admin",
        "avatar_url": None,
        "created_at": "2026-01-01T00:00:00Z",
    },
    "founder-aerogrid": {
        "id": "founder-aerogrid",
        "full_name": "Priya Sharma",
        "email": "founder@aerogrid.io",
        "role": "startup",
        "startup_id": "startup-aerogrid",
        "startup_name": "AeroGrid Tech",
        "industry": "CleanTech",
        "is_verified": True,
        "created_at": "2026-08-15T10:00:00Z",
    },
    "investor-elena": {
        "id": "investor-elena",
        "full_name": "Elena Rostova",
        "email": "elena@apexhorizon.com",
        "role": "investor",
        "investor_id": "investor-elena",
        "firm": "Apex Horizon Capital",
        "is_verified": True,
        "created_at": "2026-06-10T12:00:00Z",
    },
    "investor-david": {
        "id": "investor-david",
        "full_name": "David Miller",
        "email": "david.miller@angelinvest.org",
        "role": "investor",
        "investor_id": "investor-david",
        "firm": "Private Angel",
        "is_verified": False,
        "created_at": "2026-09-08T15:30:00Z",
    },
}


class StartupRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)
    industry: str = "Technology"
    gst_number: str = ""
    incorporation_cert: str = "INCORPORATION_CERTIFICATE.pdf"
    role: str = "startup"


class InvestorRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)
    role: str = "investor"


class LoginRequest(BaseModel):
    email: str
    password: str | None = None
    role: str | None = None


class ProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    role: str = Field(default="startup", pattern="^(startup|investor|admin)$")
    email: str | None = None


class CINVerificationResponse(BaseModel):
    verified: bool
    eligible: bool
    message: str
    company: dict[str, Any] | None = None


class GSTVerificationResponse(BaseModel):
    verified: bool
    eligible: bool
    message: str
    gstin: str = ""
    data: dict[str, Any] | None = None
    source: str | None = None
    credits_remaining: int | float | None = None
    needs_api_key: bool | None = None


@app.on_event("startup")
async def on_startup():
    pool = await db.get_pool()
    await run_migrations(pool)


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


@app.get("/users")
@app.get("/list")
async def list_users() -> list[dict[str, Any]]:
    rows = await db.fetch("SELECT * FROM public.profiles ORDER BY created_at ASC")
    if rows:
        return rows
    return list(_PROFILES.values())


@app.get("/profile")
async def get_profile(
    user: Annotated[dict[str, Any] | None, Depends(optional_current_user)],
) -> dict[str, Any]:
    user_id = (user or {}).get("sub")
    if user_id:
        row = await db.fetchrow("SELECT * FROM public.profiles WHERE id = $1", user_id)
        if row:
            return row
        if user_id in _PROFILES:
            return _PROFILES[user_id]
    # Default active profile is admin-user
    row = await db.fetchrow("SELECT * FROM public.profiles WHERE id = 'admin-user'")
    if row:
        return row
    return _PROFILES["admin-user"]


@app.get("/profile/{user_id}")
async def get_profile_by_id(user_id: str) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM public.profiles WHERE id = $1", user_id)
    if row:
        return row
    if user_id in _PROFILES:
        return _PROFILES[user_id]
    raise HTTPException(status_code=404, detail="User not found")


@app.get("/verify-cin/{cin}")
async def verify_cin(cin: str) -> CINVerificationResponse:
    """
    Instant MCA/ROC CIN verification against seeded company masterdata (Excel → roc_companies).
    Only 'Active' companies are eligible.
    """
    cin_upper = cin.upper().strip()

    try:
        company = await db.fetchrow(
            "SELECT * FROM public.roc_companies WHERE UPPER(cin) = UPPER($1)",
            cin_upper,
        )

        if not company:
            return CINVerificationResponse(
                verified=False,
                eligible=False,
                message="CIN not found in company masterdata (ROC registry seed).",
                company=None,
            )

        company_dict = dict(company)
        # Serialize dates for JSON
        for key in ("registration_date", "created_at", "updated_at"):
            if company_dict.get(key) is not None:
                company_dict[key] = str(company_dict[key])

        is_active = company_dict.get("company_status") == "Active"

        if is_active:
            return CINVerificationResponse(
                verified=True,
                eligible=True,
                message=f"CIN verified and Active in company masterdata. Company: {company_dict.get('company_name')}",
                company=company_dict,
            )

        status = company_dict.get("company_status", "Unknown")
        return CINVerificationResponse(
            verified=True,
            eligible=False,
            message=f"Company found ({status}) — only Active entities are eligible.",
            company=company_dict,
        )

    except Exception as e:
        logger.error("CIN verification error for %s: %s", cin_upper, e)
        raise HTTPException(status_code=500, detail="CIN verification failed") from e


@app.get("/verify-gst/{gstin}")
async def verify_gst(gstin: str) -> GSTVerificationResponse:
    """Live GSTIN verification via gstverify.co.in (X-API-Key = GSTVERIFY_API_KEY)."""
    result = await verify_gstin(gstin)
    return GSTVerificationResponse(
        verified=bool(result.get("verified")),
        eligible=bool(result.get("eligible")),
        message=str(result.get("message") or ""),
        gstin=str(result.get("gstin") or gstin),
        data=result.get("data") if isinstance(result.get("data"), dict) else None,
        source=result.get("source"),
        credits_remaining=result.get("credits_remaining"),
        needs_api_key=result.get("needs_api_key"),
    )


@app.post("/admin/seed-company-masterdata")
async def seed_company_masterdata_endpoint() -> dict[str, Any]:
    """Re-import database/masterdata/company_masterdata.xlsx into roc_companies."""
    pool = await db.get_pool()
    result = await seed_roc_companies_from_masterdata(pool)
    return {"message": "Company masterdata seed completed", **result}


@app.post("/register")
async def register(payload: dict[str, Any]) -> dict[str, Any]:
    role = (payload.get("role") or "startup").lower().strip()
    email = (payload.get("email") or "").lower().strip()
    name = (payload.get("name") or payload.get("full_name") or "User").strip()
    password = payload.get("password") or "password123"

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # Check DB for existing user
    existing = await db.fetchrow("SELECT * FROM public.profiles WHERE LOWER(email) = $1", email)
    if existing:
        return {"message": "User already exists", "user": existing}

    for p in _PROFILES.values():
        if p.get("email", "").lower() == email:
            return {"message": "User already exists", "user": p}

    user_id = f"user-{uuid.uuid4().hex[:8]}"

    if role == "startup":
        startup_id = f"startup-{uuid.uuid4().hex[:8]}"
        industry = payload.get("industry") or "Technology"
        gst = (payload.get("gst_number") or "").upper().strip()
        cin = (payload.get("cin") or "").upper().strip()
        inc_cert = payload.get("incorporation_cert") or "INCORPORATION_CERTIFICATE.pdf"

        # CIN verification against seeded company masterdata
        is_verified = False
        verification_status = "unverified"
        verification_score = 0
        cin_ok = False
        gst_ok = False
        gst_report: dict[str, Any] | None = None
        gst_status = "unverified"

        if cin:
            try:
                roc_company = await db.fetchrow(
                    "SELECT * FROM public.roc_companies WHERE UPPER(cin) = UPPER($1)",
                    cin,
                )
                if roc_company and roc_company.get("company_status") == "Active":
                    cin_ok = True
                    if not name or name == "User":
                        name = roc_company.get("company_name", name)
                elif roc_company:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"CIN found but company status is '{roc_company.get('company_status')}'. "
                            "Only Active entities can register."
                        ),
                    )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="CIN not found in company masterdata. Use a seeded Active CIN or update masterdata Excel.",
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.warning("CIN verification during registration failed: %s", e)

        if gst:
            try:
                gst_report = await verify_gstin(gst)
                gst_ok = bool(gst_report.get("eligible"))
                gst_status = (
                    "verified"
                    if gst_ok
                    else ("format_ok" if gst_report.get("source") == "format_only" else "failed")
                )
                # If live API is configured and GST is ineligible / invalid, block registration
                if gst_report.get("source") == "gstverify" and not gst_ok:
                    raise HTTPException(status_code=400, detail=gst_report.get("message") or "GST verification failed")
                if gst_report.get("source") == "format" and not gst_report.get("verified"):
                    raise HTTPException(status_code=400, detail=gst_report.get("message") or "Invalid GSTIN")
                # Auto-fill legal name from GST registry when available
                legal = (gst_report.get("data") or {}).get("legal_name")
                if legal and (not name or name == "User"):
                    name = legal
            except HTTPException:
                raise
            except Exception as e:
                logger.warning("GST verification during registration failed: %s", e)
                gst_report = {"message": str(e), "source": "error"}

        if cin_ok and (gst_ok or not gst or gst_status == "format_ok"):
            # Verified when CIN is Active; GST live-pass boosts score
            is_verified = True
            verification_status = "verified"
            verification_score = 98 if gst_ok else (90 if cin_ok else 70)
        elif cin_ok:
            is_verified = True
            verification_status = "verified"
            verification_score = 90

        # 1. Insert profile FIRST to satisfy foreign key in startups.owner_id
        await db.execute(
            """
            INSERT INTO public.profiles (id, email, password_hash, full_name, role, is_verified, cin)
            VALUES ($1, $2, $3, $4, 'startup', $5, $6)
            ON CONFLICT (id) DO NOTHING
            """,
            user_id, email, password, name, is_verified, cin if cin else None
        )

        # 2. Create startup in PostgreSQL
        await db.execute(
            """
            INSERT INTO public.startups (
                id, owner_id, name, slug, industry, gst_number, incorporation_cert, stage,
                email, is_verified, verification_status, verification_score, verification_timestamp,
                cin, gst_verification_status, gst_verification_report
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, 'Seed', $8, $9, $10, $11, $12, $13, $14, $15::jsonb
            )
            ON CONFLICT (id) DO NOTHING
            """,
            startup_id, user_id, name, f"{name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}",
            industry, gst, inc_cert, email, is_verified, verification_status, verification_score,
            datetime.utcnow() if is_verified else None, cin if cin else None,
            gst_status, json.dumps(gst_report) if gst_report else None,
        )

        # Notify startup-service if available
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(
                    f"{STARTUP_SERVICE_URL}/startups",
                    json={
                        "id": startup_id,
                        "name": name,
                        "industry": industry,
                        "gst_number": gst,
                        "cin": cin,
                        "incorporation_cert": inc_cert,
                        "email": email,
                        "stage": "Seed",
                        "is_verified": is_verified,
                        "verification_status": verification_status,
                        "verification_score": verification_score,
                    }
                )
        except Exception:
            pass

        profile = {
            "id": user_id,
            "full_name": name,
            "email": email,
            "role": "startup",
            "startup_id": startup_id,
            "startup_name": name,
            "industry": industry,
            "gst_number": gst,
            "cin": cin,
            "incorporation_cert": inc_cert,
            "is_verified": is_verified,
            "verification_status": verification_status,
            "verification_score": verification_score,
            "gst_verification_status": gst_status,
            "gst_verification": gst_report,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        _PROFILES[user_id] = profile
        return {"message": "Startup account created successfully", "user": profile}

    elif role == "investor":
        investor_id = f"investor-{uuid.uuid4().hex[:8]}"
        firm = payload.get("firm") or "Private Angel"
        cin = (payload.get("cin") or "").upper().strip()
        gst_number = (payload.get("gst_number") or "").upper().strip()

        # Check if corporate CIN is provided and verify it
        is_verified = False
        verification_status = "unverified"
        verification_score = 0
        
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
                    # Update firm name from ROC registry
                    firm = roc_company.get("company_name", firm)
            except Exception as e:
                logger.warning(f"CIN verification during investor registration failed: {e}")

        # 1. Insert profile FIRST to satisfy foreign key in investors.owner_id
        await db.execute(
            """
            INSERT INTO public.profiles (id, email, password_hash, full_name, role, is_verified, cin)
            VALUES ($1, $2, $3, $4, 'investor', $5, $6)
            ON CONFLICT (id) DO NOTHING
            """,
            user_id, email, password, name, is_verified, cin if cin else None
        )

        # 2. Create investor in PostgreSQL
        await db.execute(
            """
            INSERT INTO public.investors (id, owner_id, display_name, email, firm, is_verified, 
                                         verification_status, verification_score, verification_timestamp, cin, gst_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO NOTHING
            """,
            investor_id, user_id, name, email, firm, is_verified, verification_status, verification_score,
            datetime.utcnow() if is_verified else None, cin if cin else None, gst_number if gst_number else None
        )

        # Notify investor-service if available
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(
                    f"{INVESTOR_SERVICE_URL}/investors",
                    json={
                        "id": investor_id,
                        "display_name": name,
                        "email": email,
                        "firm": firm,
                        "cin": cin,
                        "gst_number": gst_number,
                        "is_verified": is_verified,
                        "verification_status": verification_status,
                        "verification_score": verification_score,
                    }
                )
        except Exception:
            pass

        profile = {
            "id": user_id,
            "full_name": name,
            "email": email,
            "role": "investor",
            "investor_id": investor_id,
            "firm": firm,
            "cin": cin,
            "gst_number": gst_number,
            "is_verified": is_verified,
            "verification_status": verification_status,
            "verification_score": verification_score,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        _PROFILES[user_id] = profile
        return {"message": "Investor account created successfully", "user": profile}

    else:
        # Admin or general role
        await db.execute(
            """
            INSERT INTO public.profiles (id, email, password_hash, full_name, role, is_verified)
            VALUES ($1, $2, $3, $4, 'admin', TRUE)
            ON CONFLICT (id) DO NOTHING
            """,
            user_id, email, password, name
        )

        profile = {
            "id": user_id,
            "full_name": name,
            "email": email,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        _PROFILES[user_id] = profile
        return {"message": "Admin account created successfully", "user": profile}


@app.post("/login")
async def login(payload: LoginRequest) -> dict[str, Any]:
    email = payload.email.lower().strip()

    # 1. Look up by exact email in DB
    user_row = await db.fetchrow("SELECT * FROM public.profiles WHERE LOWER(email) = $1", email)
    if user_row:
        # Enrich startup_name or firm if missing
        if user_row.get("role") == "startup" and user_row.get("startup_id"):
            startup = await db.fetchrow("SELECT name, industry FROM public.startups WHERE id = $1", user_row["startup_id"])
            if startup:
                user_row["startup_name"] = startup.get("name")
                user_row["industry"] = startup.get("industry")
        elif user_row.get("role") == "investor" and user_row.get("investor_id"):
            inv = await db.fetchrow("SELECT firm FROM public.investors WHERE id = $1", user_row["investor_id"])
            if inv:
                user_row["firm"] = inv.get("firm")
        return {"message": "Login successful", "user": user_row}

    # 2. Check in-memory profiles by email
    for p in _PROFILES.values():
        if p.get("email", "").lower() == email:
            return {"message": "Login successful", "user": p}

    # 3. Match role aliases for easy testing
    role_map = {
        "admin": "admin-user",
        "superadmin": "admin-user",
        "startup": "founder-aerogrid",
        "founder": "founder-aerogrid",
        "investor": "investor-elena",
        "verified_investor": "investor-elena",
        "unverified_investor": "investor-david",
        "david": "investor-david",
    }
    if email in role_map:
        target_id = role_map[email]
        db_user = await db.fetchrow("SELECT * FROM public.profiles WHERE id = $1", target_id)
        if db_user:
            return {"message": "Login successful", "user": db_user}
        if target_id in _PROFILES:
            return {"message": "Login successful", "user": _PROFILES[target_id]}

    # 4. Fallback create for smooth test experience and persist to PostgreSQL
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    role = payload.role or ("investor" if "investor" in email else "startup")
    name = email.split("@")[0].title() if "@" in email else email.title()

    new_user = {
        "id": user_id,
        "full_name": name,
        "email": email,
        "role": role,
        "is_verified": False,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    await db.execute(
        """
        INSERT INTO public.profiles (id, email, password_hash, full_name, role, is_verified)
        VALUES ($1, $2, $3, $4, $5, FALSE)
        ON CONFLICT (id) DO NOTHING
        """,
        user_id, email, payload.password or "password123", name, role
    )

    _PROFILES[user_id] = new_user
    return {"message": "Login successful", "user": new_user}


@app.post("/profile")
async def upsert_profile(payload: ProfileCreate) -> dict[str, Any]:
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    profile = {
        "id": user_id,
        "full_name": payload.full_name,
        "role": payload.role,
        "email": payload.email,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    if payload.email:
        await db.execute(
            """
            INSERT INTO public.profiles (id, email, full_name, role)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
            """,
            user_id, payload.email, payload.full_name, payload.role
        )
    _PROFILES[user_id] = profile
    return profile


@app.post("/admin/run-migrations")
async def run_migrations_endpoint() -> dict[str, str]:
    """Admin endpoint to trigger database migrations."""
    pool = await db.get_pool()
    await run_migrations(pool)
    return {"message": "Migrations completed successfully"}

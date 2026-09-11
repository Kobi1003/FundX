"""User service — profiles, registration, authentication and roles."""

from __future__ import annotations

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

SERVICE_NAME = os.getenv("SERVICE_NAME", "user-service")
STARTUP_SERVICE_URL = os.getenv("STARTUP_SERVICE_URL", "http://startup-service:8002")
INVESTOR_SERVICE_URL = os.getenv("INVESTOR_SERVICE_URL", "http://investor-service:8003")

app = FastAPI(title="User Service", version="0.1.0")

# Initial realistic seed profiles
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
    industry: str
    gst_number: str
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


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/users")
@app.get("/list")
async def list_users() -> list[dict[str, Any]]:
    return list(_PROFILES.values())


@app.get("/profile")
async def get_profile(
    user: Annotated[dict[str, Any] | None, Depends(optional_current_user)],
) -> dict[str, Any]:
    user_id = (user or {}).get("sub")
    if user_id and user_id in _PROFILES:
        return _PROFILES[user_id]
    # Default active profile
    return _PROFILES["admin-user"]


@app.get("/profile/{user_id}")
async def get_profile_by_id(user_id: str) -> dict[str, Any]:
    if user_id in _PROFILES:
        return _PROFILES[user_id]
    raise HTTPException(status_code=404, detail="User not found")


@app.post("/register")
async def register(payload: dict[str, Any]) -> dict[str, Any]:
    role = payload.get("role", "startup").lower()
    email = payload.get("email", "").lower().strip()
    name = payload.get("name") or payload.get("full_name") or "User"

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # Check if exists
    for p in _PROFILES.values():
        if p.get("email", "").lower() == email:
            return {"message": "User already exists", "user": p}

    user_id = f"user-{uuid.uuid4().hex[:8]}"

    if role == "startup":
        startup_id = f"startup-{uuid.uuid4().hex[:8]}"
        industry = payload.get("industry", "Technology")
        gst = payload.get("gst_number", "")
        inc_cert = payload.get("incorporation_cert", "INCORPORATION_CERTIFICATE.pdf")
        
        # Call startup service to create startup record
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{STARTUP_SERVICE_URL}/startups",
                    json={
                        "name": name,
                        "industry": industry,
                        "gst_number": gst,
                        "incorporation_cert": inc_cert,
                        "email": email,
                        "stage": "Seed",
                    }
                )
        except Exception:  # noqa: BLE001
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
            "incorporation_cert": inc_cert,
            "is_verified": False,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        _PROFILES[user_id] = profile
        return {"message": "Startup account created successfully", "user": profile}

    elif role == "investor":
        investor_id = f"investor-{uuid.uuid4().hex[:8]}"
        # Call investor service to create investor record
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{INVESTOR_SERVICE_URL}/investors",
                    json={
                        "display_name": name,
                        "email": email,
                        "firm": "Private Angel",
                    }
                )
        except Exception:  # noqa: BLE001
            pass

        profile = {
            "id": user_id,
            "full_name": name,
            "email": email,
            "role": "investor",
            "investor_id": investor_id,
            "firm": "Private Angel",
            "is_verified": False,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        _PROFILES[user_id] = profile
        return {"message": "Investor account created successfully", "user": profile}

    else:
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
    
    # Match by email
    for p in _PROFILES.values():
        if p.get("email", "").lower() == email:
            return {"message": "Login successful", "user": p}

    # Match by role if email is a role alias
    if email in ["admin", "superadmin"]:
        return {"message": "Login successful", "user": _PROFILES["admin-user"]}
    if email in ["startup", "founder"]:
        return {"message": "Login successful", "user": _PROFILES["founder-aerogrid"]}
    if email in ["investor", "verified_investor"]:
        return {"message": "Login successful", "user": _PROFILES["investor-elena"]}
    if email in ["unverified_investor", "david"]:
        return {"message": "Login successful", "user": _PROFILES["investor-david"]}

    # Fallback create on login for smooth demo experience
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    role = payload.role or "startup"
    new_user = {
        "id": user_id,
        "full_name": email.split("@")[0].title() if "@" in email else email.title(),
        "email": email,
        "role": role,
        "is_verified": False,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
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
    _PROFILES[user_id] = profile
    return profile

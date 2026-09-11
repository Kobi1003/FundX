"""
GST verification via gstverify.co.in developer API.

Docs: https://gstverify.co.in/dev-api/
  GET https://gstverify.co.in/api/v1/verify/{GSTIN}
  Header: X-API-Key: <GSTVERIFY_API_KEY>
"""

from __future__ import annotations

import os
import re
from typing import Any

import httpx

GSTIN_PATTERN = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
)

GSTVERIFY_BASE_URL = os.getenv(
    "GSTVERIFY_BASE_URL", "https://gstverify.co.in"
).rstrip("/")


def normalize_gstin(gstin: str | None) -> str:
    return (gstin or "").strip().upper().replace(" ", "")


def format_valid(gstin: str) -> bool:
    return bool(GSTIN_PATTERN.match(gstin))


async def verify_gstin(gstin: str | None) -> dict[str, Any]:
    """
    Verify GSTIN using gstverify.co.in when GSTVERIFY_API_KEY is set.

    Returns a normalized FundX response:
      verified, eligible, message, gstin, data, source, credits_remaining
    """
    clean = normalize_gstin(gstin)
    if not clean:
        return {
            "verified": False,
            "eligible": False,
            "gstin": "",
            "message": "GSTIN is required.",
            "data": None,
            "source": "none",
        }

    if not format_valid(clean):
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": "Invalid GSTIN format. Expected 15-character GSTIN (e.g. 27AABCA1234F1Z5).",
            "data": None,
            "source": "format",
        }

    api_key = (os.getenv("GSTVERIFY_API_KEY") or "").strip()
    if not api_key:
        # Offline / no-key path: format check only (never claim registry verification)
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": (
                "GSTIN format is valid, but GSTVERIFY_API_KEY is not configured. "
                "Add your key from https://gstverify.co.in/dev-api/ to enable live registry verification."
            ),
            "data": {"gstin": clean, "format_ok": True},
            "source": "format_only",
            "needs_api_key": True,
        }

    url = f"{GSTVERIFY_BASE_URL}/api/v1/verify/{clean}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers={"X-API-Key": api_key})
    except httpx.RequestError as exc:
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": f"GST verification service unreachable: {exc}",
            "data": None,
            "source": "error",
        }

    if resp.status_code == 401:
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": "GSTVERIFY_API_KEY is missing or invalid (401).",
            "data": None,
            "source": "error",
        }
    if resp.status_code == 402:
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": "GSTVerify credits exhausted (402). Recharge or use demo credits.",
            "data": None,
            "source": "error",
        }
    if resp.status_code == 422:
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": "GSTVerify rejected GSTIN as invalid (422).",
            "data": None,
            "source": "gstverify",
        }
    if resp.status_code == 429:
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": "GSTVerify rate limit exceeded (429). Try again shortly.",
            "data": None,
            "source": "error",
        }
    if resp.status_code >= 500:
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": f"GSTVerify upstream error ({resp.status_code}).",
            "data": None,
            "source": "error",
        }

    try:
        payload = resp.json()
    except Exception:
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": "GSTVerify returned a non-JSON response.",
            "data": None,
            "source": "error",
        }

    data = payload.get("data") if isinstance(payload, dict) else None
    success = bool(payload.get("success")) if isinstance(payload, dict) else False
    if not success or not isinstance(data, dict):
        return {
            "verified": False,
            "eligible": False,
            "gstin": clean,
            "message": payload.get("message") if isinstance(payload, dict) else "GSTIN not found.",
            "data": data if isinstance(data, dict) else None,
            "source": "gstverify",
            "credits_remaining": payload.get("credits_remaining") if isinstance(payload, dict) else None,
        }

    status = str(data.get("status") or "").strip()
    active = status.lower() in {"active", "active taxpayer", "registered"}
    legal = data.get("legal_name") or data.get("trade_name") or "Registered entity"

    return {
        "verified": True,
        "eligible": active,
        "gstin": data.get("gstin") or clean,
        "message": (
            f"GSTIN verified via GSTVerify — {legal} ({status or 'Unknown status'})."
            if active
            else f"GSTIN found but status is '{status or 'Unknown'}' — only Active taxpayers are eligible."
        ),
        "data": data,
        "source": "gstverify",
        "cached": payload.get("cached"),
        "credits_remaining": payload.get("credits_remaining"),
    }

"""
AI Background Assessment agents for startups and investors.

IMPORTANT: These are heuristic / LLM-assisted assessments for a demo.
They do NOT constitute legal KYC, GST registry authentication, or accredited-investor certification.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from shared.local_storage import read_text_excerpt


def validate_gstin(gst_number: str | None) -> dict[str, Any]:
    """Validate Indian GSTIN format (15 characters) — format only, not registry lookup."""
    if not gst_number:
        return {"valid": False, "state_code": None, "pan": None, "message": "GST number missing"}

    clean_gst = gst_number.strip().upper()
    pattern = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"

    if re.match(pattern, clean_gst):
        return {
            "valid": True,
            "gstin": clean_gst,
            "state_code": clean_gst[:2],
            "pan": clean_gst[2:12],
            "message": f"GSTIN format valid (state code {clean_gst[:2]}). Not checked against government registry.",
        }

    if len(clean_gst) >= 10:
        return {
            "valid": True,
            "gstin": clean_gst,
            "state_code": clean_gst[:2] if clean_gst[:2].isdigit() else None,
            "pan": clean_gst[2:12] if len(clean_gst) >= 12 else clean_gst,
            "message": "Provisional GST-like identifier accepted for demo (format soft-pass).",
        }
    return {"valid": False, "message": "Invalid GST format (expected 15-character GSTIN)"}


def _experience_signals(text: str) -> list[str]:
    lowered = text.lower()
    signals: list[str] = []
    keywords = [
        ("venture", "venture / VC language"),
        ("angel", "angel investing"),
        ("syndicate", "syndicate activity"),
        ("seed", "seed-stage investing"),
        ("series a", "series A exposure"),
        ("partner", "partner-level role"),
        ("founder", "founder experience"),
        ("portfolio", "portfolio construction"),
        ("fintech", "fintech domain"),
        ("cleantech", "cleantech domain"),
        ("accredited", "self-attested accreditation mention"),
    ]
    for key, label in keywords:
        if key in lowered:
            signals.append(label)
    return signals


async def run_startup_verifier(payload: dict[str, Any]) -> dict[str, Any]:
    """AI Background Assessment for a startup (demo heuristics)."""
    name = payload.get("name", "Startup")
    gst = payload.get("gst_number")
    inc_cert = payload.get("incorporation_cert")
    industry = payload.get("industry", "Technology")
    stage = payload.get("stage", "Seed")
    storage_path = payload.get("storage_path")
    doc_excerpt = payload.get("document_excerpt") or read_text_excerpt(storage_path)

    gst_check = validate_gstin(gst)
    inc_present = bool(inc_cert and len(str(inc_cert).strip()) > 0) or bool(doc_excerpt)

    score = 75
    if gst_check["valid"]:
        score += 15
    else:
        score -= 20
    if inc_present:
        score += 10
    else:
        score -= 10
    if doc_excerpt and len(doc_excerpt) > 80:
        score += 3

    score = max(30, min(98, score))
    is_verified = score >= 70

    audit_checks = [
        {
            "check": "GSTIN Format Check",
            "status": "PASS" if gst_check["valid"] else "FLAGGED",
            "detail": gst_check["message"],
        },
        {
            "check": "Incorporation Document Present",
            "status": "PASS" if inc_present else "INCOMPLETE",
            "detail": (
                f"Document '{inc_cert or 'Pending upload'}' on file for demo assessment. "
                "Not authenticated against ROC/MCA."
            ),
        },
        {
            "check": "Sector Notes (Demo)",
            "status": "PASS",
            "detail": f"No seeded adverse flags for {industry} at {stage} stage.",
        },
        {
            "check": "Entity Self-Declaration",
            "status": "PASS",
            "detail": f"Founder-provided profile for '{name}' accepted for marketplace demo.",
        },
    ]

    return {
        "status": "ai_assessed" if is_verified else "action_required",
        "is_verified": is_verified,
        "score": score,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "verified_badge": "AI Background Assessment" if is_verified else "Unassessed",
        "summary": (
            f"AI Background Assessment completed for {name}. Confidence score: {score}/100. "
            f"{'Eligible for verified-style demo listing.' if is_verified else 'Provide valid GST format and incorporation document.'} "
            "This is not legal government verification."
        ),
        "audit_checks": audit_checks,
        "risk_level": "LOW" if score >= 85 else ("MODERATE" if score >= 70 else "ELEVATED"),
        "document_excerpt_chars": len(doc_excerpt or ""),
    }


async def run_investor_cv_verifier(payload: dict[str, Any]) -> dict[str, Any]:
    """AI Background Assessment for an investor CV (demo heuristics)."""
    display_name = payload.get("display_name", "Investor")
    firm = payload.get("firm", "Independent Angel Syndicate")
    bio = payload.get("bio", "") or ""
    cv_text = payload.get("cv_text", "") or ""
    cv_filename = payload.get("cv_filename", "") or ""
    storage_path = payload.get("cv_storage_path")

    if storage_path and len(cv_text.strip()) < 40:
        cv_text = read_text_excerpt(storage_path) or cv_text

    combined = f"{bio}\n{cv_text}".strip()
    has_cv = bool(cv_filename or (cv_text and len(cv_text.strip()) > 10))
    signals = _experience_signals(combined)

    score = 50
    if has_cv:
        score += 25
    if len(combined) > 200:
        score += 10
    if len(combined) > 600:
        score += 5
    score += min(15, len(signals) * 3)
    if firm and firm.lower() not in {"private angel", "independent", ""}:
        score += 5

    score = max(30, min(98, score))
    is_verified = score >= 70

    badges = []
    if is_verified:
        badges = ["AI Assessed Investor", "Dealroom Eligible (Demo)"]
        if any("syndicate" in s for s in signals):
            badges.append("Syndicate Signals (Self-Attested)")

    checks = [
        {
            "check": "CV Document Present",
            "status": "PASS" if has_cv else "MISSING",
            "detail": f"Document '{cv_filename or 'CV Upload'}' {'found' if has_cv else 'missing'}.",
        },
        {
            "check": "Experience Signal Heuristics",
            "status": "PASS" if signals else ("PASS" if has_cv else "PENDING"),
            "detail": (
                f"Detected: {', '.join(signals)}" if signals else "Limited keyword signals in CV text."
            ),
        },
        {
            "check": "Accreditation / KYC",
            "status": "SELF_ATTESTED" if is_verified else "PENDING",
            "detail": "Demo only — no legal accredited-investor verification performed.",
        },
        {
            "check": "Dealroom Eligibility (Demo)",
            "status": "PASS" if is_verified else "GATED",
            "detail": "Score threshold for submitting demo offers.",
        },
    ]

    return {
        "status": "ai_assessed" if is_verified else "incomplete",
        "is_verified": is_verified,
        "score": score,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "verified_badge": "AI Background Assessment" if is_verified else "Assessment Required",
        "summary": (
            f"Investor AI Background Assessment for {display_name} ({firm}). "
            f"Credibility rating: {score}/100. "
            f"{'Eligible for demo deal negotiation.' if is_verified else 'Upload a CV to unlock deal negotiation.'} "
            "Not legal identity verification."
        ),
        "badges": badges,
        "checks": checks,
        "signals": signals,
    }

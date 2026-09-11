#!/usr/bin/env python3
"""
Smoke-test FundX AI workflows through the API gateway (Mock-friendly).

Usage:
  python scripts/smoke_ai_workflows.py [--gateway http://localhost:8000]
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


def post(gateway: str, path: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"{gateway}{path}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get(gateway: str, path: str) -> dict:
    with urllib.request.urlopen(f"{gateway}{path}", timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gateway", default="http://localhost:8000")
    args = parser.parse_args()
    g = args.gateway.rstrip("/")

    results: list[tuple[str, bool, str]] = []

    def run(name: str, fn):
        try:
            out = fn()
            results.append((name, True, "ok"))
            return out
        except Exception as exc:  # noqa: BLE001
            results.append((name, False, str(exc)))
            return None

    run("gateway_health", lambda: get(g, "/health"))

    run(
        "simulate",
        lambda: post(
            g,
            "/api/ai/simulate",
            {
                "current_revenue": 40000,
                "current_customers": 120,
                "growth_rate": 0.2,
                "cac": 400,
                "churn": 0.05,
                "marketing_spend": 20000,
                "operating_expenses": 35000,
                "funding": 500000,
                "months": 12,
            },
        ),
    )

    run(
        "verify_startup",
        lambda: post(
            g,
            "/api/ai/verify/startup",
            {
                "name": "NovaGrid Energy Demo",
                "gst_number": "29AABCU9603R1ZM",
                "incorporation_cert": "AEROGRID_INCORPORATION_DEMO.txt",
                "industry": "CleanTech",
                "stage": "Seed",
            },
        ),
    )

    cv_path = Path(__file__).resolve().parents[1] / "uploads" / "demo_cvs" / "ELENA_ROSTOVA_CV.txt"
    cv_text = cv_path.read_text(encoding="utf-8") if cv_path.exists() else "Managing Partner venture investor demo CV."

    run(
        "verify_investor",
        lambda: post(
            g,
            "/api/ai/verify/investor",
            {
                "display_name": "Elena Rostova Demo",
                "firm": "Apex Horizon Capital",
                "bio": "Climate and deep-tech investor",
                "cv_filename": "ELENA_ROSTOVA_CV.txt",
                "cv_text": cv_text,
                "cv_storage_path": "demo_cvs/ELENA_ROSTOVA_CV.txt",
            },
        ),
    )

    run(
        "analyze_thesis",
        lambda: post(
            g,
            "/api/ai/analyze-thesis",
            {
                "pitch": "NovaGrid Energy",
                "thesis_text": (
                    "Commercial solar + storage is constrained by passive battery management; "
                    "predictive optimization unlocks better ROI with measurable pilot traction."
                ),
                "industry": "CleanTech",
                "stage": "Seed",
                "amount": 750000,
                "equity_pct": 10,
                "royalty_pct": 3,
                "metrics": {"revenue": 540000, "customers": 180, "growth_rate": 0.25, "cac": 420, "churn": 0.04},
            },
        ),
    )

    run(
        "startup_analysis",
        lambda: post(
            g,
            "/api/ai/startup-analysis",
            {
                "name": "NovaGrid Energy",
                "industry": "CleanTech",
                "stage": "Seed",
                "thesis": "Edge-AI microgrid controllers cut commercial peak bills.",
                "document_summaries": ["Pilot telemetry shows 32% peak reduction across 8 sites."],
                "metrics": {
                    "market_size": 12000000000,
                    "growth_rate": 0.35,
                    "cac": 420,
                    "churn": 0.04,
                    "customers": 180,
                    "revenue": 540000,
                    "marketing_budget": 90000,
                    "operating_cost": 320000,
                },
            },
        ),
    )

    run(
        "investor_analysis",
        lambda: post(
            g,
            "/api/ai/investor-analysis",
            {
                "display_name": "Elena Rostova",
                "firm": "Apex Horizon Capital",
                "thesis": "Climate infrastructure and intelligent energy software.",
                "preferences": {"industries": ["CleanTech"], "check_size_max": 2000000},
                "document_summaries": [cv_text[:800]],
            },
        ),
    )

    run(
        "negotiation",
        lambda: post(
            g,
            "/api/ai/negotiation",
            {
                "startup_name": "NovaGrid Energy",
                "investor_name": "Elena Rostova",
                "offer_amount": 1000000,
                "equity_pct": 10,
            },
        ),
    )

    run("demo_sample", lambda: get(g, "/api/ai/demo/sample"))

    print("\n=== FundX AI workflow smoke test ===")
    failed = 0
    for name, ok, detail in results:
        status = "PASS" if ok else "FAIL"
        if not ok:
            failed += 1
        print(f"[{status}] {name}: {detail}")

    print(f"\n{len(results) - failed}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as exc:
        print(f"Gateway unreachable: {exc}", file=sys.stderr)
        print("Start the stack with: docker compose up --build", file=sys.stderr)
        raise SystemExit(2) from exc

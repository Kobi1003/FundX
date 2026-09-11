"""AI Service — Google ADK orchestration, providers, cache, deterministic simulation."""

from __future__ import annotations

import os
import sys
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.config import get_settings  # noqa: E402
from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402

from app.schemas.requests import (  # noqa: E402
    InvestorAnalysisRequest,
    NegotiationRequest,
    SimulationRequest,
    StartupAnalysisRequest,
)
from app.simulation.simulator import run_scenarios  # noqa: E402
from app.workflows.investor_analysis import run_investor_analysis  # noqa: E402
from app.workflows.negotiation import run_negotiation  # noqa: E402
from app.workflows.startup_analysis import run_startup_analysis  # noqa: E402

SERVICE_NAME = os.getenv("SERVICE_NAME", "ai-service")

app = FastAPI(title="AI Service", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, Any]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "demo_mode": settings.demo_mode,
        "ai_provider": settings.ai_provider,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.post("/ai/startup-analysis")
async def startup_analysis(payload: StartupAnalysisRequest) -> dict[str, Any]:
    return await run_startup_analysis(payload)


@app.post("/ai/investor-analysis")
async def investor_analysis(payload: InvestorAnalysisRequest) -> dict[str, Any]:
    return await run_investor_analysis(payload)


@app.post("/ai/negotiation")
async def negotiation(payload: NegotiationRequest) -> dict[str, Any]:
    return await run_negotiation(payload)


@app.post("/ai/simulate")
async def simulate(payload: SimulationRequest) -> dict[str, Any]:
    """Deterministic math only — no LLM tokens."""
    return run_scenarios(payload)


@app.get("/ai/demo/sample")
async def demo_sample() -> dict[str, Any]:
    settings = get_settings()
    if not settings.demo_mode and settings.ai_provider != "mock":
        raise HTTPException(status_code=400, detail="Sample payload available when DEMO_MODE or mock provider")
    return {
        "startup": {
            "name": "NovaGrid Energy",
            "industry": "CleanTech",
            "stage": "Seed",
            "metrics": {
                "market_size": 12_000_000_000,
                "growth_rate": 0.35,
                "cac": 420,
                "churn": 0.04,
                "customers": 180,
                "revenue": 540_000,
                "marketing_budget": 90_000,
                "operating_cost": 320_000,
            },
        },
        "investor": {
            "display_name": "Asha Rao",
            "firm": "Horizon Ventures",
            "industries": ["CleanTech", "SaaS"],
            "check_size_min": 250_000,
            "check_size_max": 1_500_000,
        },
    }

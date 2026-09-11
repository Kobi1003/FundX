"""AI Service — Google ADK orchestration, providers, cache, deterministic simulation."""

from __future__ import annotations

import os
import sys
import uuid
from typing import Any

from fastapi import BackgroundTasks, FastAPI, HTTPException
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
from app.simulation.sensitivity import run_sensitivity  # noqa: E402
from app.workflows.investor_analysis import run_investor_analysis  # noqa: E402
from app.workflows.negotiation import run_negotiation  # noqa: E402
from app.workflows.startup_analysis import run_startup_analysis  # noqa: E402
from app.agents.verifier_agent import run_startup_verifier, run_investor_cv_verifier  # noqa: E402
from app.agents.orchestrator import ADKIntegrationPoint  # noqa: E402
from app.workflows.thesis_analyzer import run_thesis_analysis  # noqa: E402
from shared.local_storage import UPLOAD_ROOT  # noqa: E402

SERVICE_NAME = os.getenv("SERVICE_NAME", "ai-service")

app = FastAPI(title="AI Service", version="0.1.0")

_ANALYSIS_JOBS: dict[str, dict[str, Any]] = {}
_SIMULATION_RESULTS: dict[str, dict[str, Any]] = {}


def _record_simulation(payload: SimulationRequest) -> dict[str, Any]:
    """In-memory audit store for the MVP; its API is ready for durable storage."""
    result = run_scenarios(payload)
    _SIMULATION_RESULTS[result["simulation_id"]] = result
    return result


async def _execute_analysis_job(job_id: str, payload: StartupAnalysisRequest) -> None:
    _ANALYSIS_JOBS[job_id]["status"] = "RUNNING"
    try:
        result = await run_startup_analysis(payload)
        _ANALYSIS_JOBS[job_id]["status"] = "COMPLETED"
        _ANALYSIS_JOBS[job_id]["result"] = result
    except Exception as exc:  # noqa: BLE001
        _ANALYSIS_JOBS[job_id]["status"] = "FAILED"
        _ANALYSIS_JOBS[job_id]["error"] = str(exc)


@app.get("/health")
async def health() -> dict[str, Any]:
    settings = get_settings()
    adk = ADKIntegrationPoint()
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "demo_mode": settings.demo_mode,
        "ai_provider": settings.ai_provider,
        "mock_research": settings.mock_research,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
        "upload_root": str(UPLOAD_ROOT),
        "adk": adk.build_runner_notes(),
    }


@app.post("/ai/startup-analysis")
async def startup_analysis(payload: StartupAnalysisRequest) -> dict[str, Any]:
    return await run_startup_analysis(payload)


@app.post("/ai/jobs/startup-analysis")
async def create_analysis_job(payload: StartupAnalysisRequest, bg_tasks: BackgroundTasks) -> dict[str, Any]:
    """Background async AI analysis job as defined in Section 25."""
    job_id = str(uuid.uuid4())
    _ANALYSIS_JOBS[job_id] = {
        "job_id": job_id,
        "status": "QUEUED",
        "result": None,
        "error": None,
    }
    bg_tasks.add_task(_execute_analysis_job, job_id, payload)
    return {"job_id": job_id, "status": "QUEUED"}


@app.get("/ai/jobs/{job_id}")
async def get_analysis_job(job_id: str) -> dict[str, Any]:
    if job_id not in _ANALYSIS_JOBS:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return _ANALYSIS_JOBS[job_id]


@app.post("/ai/investor-analysis")
async def investor_analysis(payload: InvestorAnalysisRequest) -> dict[str, Any]:
    return await run_investor_analysis(payload)


@app.post("/ai/negotiation")
async def negotiation(payload: NegotiationRequest) -> dict[str, Any]:
    return await run_negotiation(payload)


@app.post("/ai/simulate")
async def simulate(payload: SimulationRequest) -> dict[str, Any]:
    """Deterministic math only — no LLM tokens."""
    return _record_simulation(payload)


@app.post("/ai/simulation/scenarios")
async def simulation_scenarios(payload: SimulationRequest) -> dict[str, Any]:
    """Explicit scenario endpoint; retained /ai/simulate remains backward-compatible."""
    return _record_simulation(payload)


@app.post("/ai/simulation/sensitivity")
async def simulation_sensitivity(payload: SimulationRequest) -> dict[str, Any]:
    return {"baseline": _record_simulation(payload)["scenarios"]["base"], "sensitivity": run_sensitivity(payload)}


@app.get("/ai/simulation/{simulation_id}")
async def get_simulation(simulation_id: str) -> dict[str, Any]:
    if simulation_id not in _SIMULATION_RESULTS:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return _SIMULATION_RESULTS[simulation_id]


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


@app.post("/ai/verify/startup")
async def verify_startup_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return await run_startup_verifier(payload)


@app.post("/ai/verify/investor")
async def verify_investor_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return await run_investor_cv_verifier(payload)


@app.post("/ai/analyze-thesis")
async def analyze_thesis_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return await run_thesis_analysis(payload)


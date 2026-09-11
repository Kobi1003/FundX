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


from app.investor_due_diligence.workflow import InvestorDueDiligenceWorkflow  # noqa: E402

_due_diligence_workflow = InvestorDueDiligenceWorkflow()


@app.post("/ai/verify/startup")
async def verify_startup_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return await run_startup_verifier(payload)


@app.post("/ai/verify/investor")
async def verify_investor_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    investor_name = payload.get("display_name") or payload.get("investor_name") or "Investor"
    organization = payload.get("firm") or payload.get("organization") or "Private Angel"
    designation = payload.get("designation") or payload.get("title") or "Partner"
    bio = payload.get("bio")
    cv_text = payload.get("cv_text")
    cv_filename = payload.get("cv_filename")

    report = await _due_diligence_workflow.run(
        investor_name=investor_name,
        organization=organization,
        designation=designation,
        bio=bio,
        cv_text=cv_text,
        cv_filename=cv_filename,
    )
    
    report_dict = report.model_dump()
    is_verified = report.overall_status in ["VERIFIED", "PARTIALLY_VERIFIED"]
    
    # Backwards-compatibility metadata alongside rich evidence-first report
    return {
        "status": report.overall_status.value.lower(),
        "is_verified": is_verified,
        "score": 90 if report.overall_evidence_strength.value == "HIGH" else (75 if report.overall_evidence_strength.value == "MEDIUM" else 45),
        "overall_evidence_strength": report.overall_evidence_strength.value,
        "overall_status": report.overall_status.value,
        "summary": report.summary,
        "due_diligence_report": report_dict,
        "report": report_dict,
    }


@app.post("/ai/analyze-thesis")
async def analyze_thesis_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return await run_thesis_analysis(payload)


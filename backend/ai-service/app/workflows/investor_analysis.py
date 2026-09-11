"""Investor analysis — limited AI calls + structured preferences."""

from __future__ import annotations

from typing import Any

from shared.config import get_settings

from app.agents.orchestrator import AgentRunner
from app.cache.cache import get_cached, set_cached
from app.cache.hashing import hash_input
from app.schemas.requests import InvestorAnalysisRequest
from app.schemas.responses import AgentStepResult, WorkflowResult


async def run_investor_analysis(payload: InvestorAnalysisRequest) -> dict[str, Any]:
    settings = get_settings()
    input_hash = hash_input(payload.model_dump())
    cache_key = f"investor_analysis:{input_hash}"

    if not payload.force_refresh:
        cached = get_cached(cache_key)
        if cached:
            cached = dict(cached)
            cached["from_cache"] = True
            return cached

    # Cap this workflow to fewer calls than startup analysis
    runner = AgentRunner(max_calls=min(3, settings.max_ai_calls_per_workflow))
    prompt = (
        f"Assess investor {payload.display_name} ({payload.firm}). "
        f"Thesis: {payload.thesis}. Preferences: {payload.preferences}. "
        f"Docs: {payload.document_summaries[:3]}"
    )
    step = await runner.call_agent("investor", prompt)

    result = WorkflowResult(
        workflow="investor_analysis",
        status="completed",
        provider=settings.ai_provider if not settings.demo_mode else "mock",
        demo_mode=settings.demo_mode,
        ai_calls=runner.tracker.calls,
        max_ai_calls=runner.tracker.max_calls,
        input_hash=input_hash,
        steps=[AgentStepResult(**{**step, "structured": {}})],
        metrics={},
        report=step["summary"],
    )
    data = result.model_dump()
    set_cached(cache_key, data)
    return data

"""
Startup analysis workflow — bounded sequential agents.

Document → Market → Competition → Financial → Red Team → Investment Analyst

Simulation math runs in Python (no tokens). Max AI calls enforced by AgentRunner.
"""

from __future__ import annotations

from typing import Any

from shared.config import get_settings

from app.agents.competition_agent import run_competition_agent
from app.agents.document_agent import run_document_agent
from app.agents.financial_agent import run_financial_agent
from app.agents.investment_analyst_agent import run_investment_analyst_agent
from app.agents.market_agent import run_market_agent
from app.agents.orchestrator import AgentRunner
from app.agents.red_team_agent import run_red_team_agent
from app.cache.cache import get_cached, set_cached
from app.cache.hashing import hash_input
from app.schemas.requests import SimulationRequest, StartupAnalysisRequest
from app.schemas.responses import AgentStepResult, WorkflowResult
from app.simulation.simulator import run_scenarios


async def run_startup_analysis(payload: StartupAnalysisRequest) -> dict[str, Any]:
    settings = get_settings()
    input_hash = hash_input(payload.model_dump())
    cache_key = f"startup_analysis:{input_hash}"

    if not payload.force_refresh:
        cached = get_cached(cache_key)
        if cached:
            cached = dict(cached)
            cached["from_cache"] = True
            return cached

    metrics = payload.metrics.model_dump()
    simulation = run_scenarios(
        SimulationRequest(
            current_revenue=metrics.get("revenue") or 0,
            current_customers=metrics.get("customers") or 0,
            growth_rate=metrics.get("growth_rate") or 0.2,
            cac=metrics.get("cac") or 0,
            churn=metrics.get("churn") or 0.05,
            marketing_spend=metrics.get("marketing_budget") or 0,
            operating_expenses=metrics.get("operating_cost") or 0,
            funding=250_000,
            months=12,
        )
    )

    runner = AgentRunner()
    steps: list[dict[str, Any]] = []

    steps.append(
        await run_document_agent(
            runner,
            name=payload.name,
            docs=payload.document_summaries,
            thesis=payload.thesis,
        )
    )
    steps.append(await run_market_agent(runner, industry=payload.industry, metrics=metrics))
    steps.append(await run_competition_agent(runner, name=payload.name, industry=payload.industry))
    steps.append(await run_financial_agent(runner, metrics=metrics, simulation=simulation))
    steps.append(
        await run_red_team_agent(
            runner,
            name=payload.name,
            prior_summaries=[s["summary"] for s in steps],
        )
    )
    analyst = await run_investment_analyst_agent(
        runner,
        name=payload.name,
        step_summaries=[s["summary"] for s in steps],
        metrics=metrics,
    )
    steps.append(analyst)

    result = WorkflowResult(
        workflow="startup_analysis",
        status="completed",
        provider=settings.ai_provider if not settings.demo_mode else "mock",
        demo_mode=settings.demo_mode,
        ai_calls=runner.tracker.calls,
        max_ai_calls=runner.tracker.max_calls,
        input_hash=input_hash,
        from_cache=False,
        steps=[AgentStepResult(**{**s, "structured": {}}) for s in steps],
        metrics=metrics,
        simulation=simulation,
        report=analyst["summary"],
    )
    data = result.model_dump()
    set_cached(cache_key, data)
    return data

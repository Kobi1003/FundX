"""Negotiation copilot workflow — single bounded agent call + deterministic dilution."""

from __future__ import annotations

from typing import Any

from shared.config import get_settings

from app.agents.negotiation_agent import run_negotiation_agent
from app.agents.orchestrator import AgentRunner
from app.cache.cache import get_cached, set_cached
from app.cache.hashing import hash_input
from app.schemas.requests import NegotiationRequest
from app.schemas.responses import AgentStepResult, WorkflowResult
from app.simulation.dilution_model import post_money_ownership
from app.simulation.valuation_model import implied_valuation


async def run_negotiation(payload: NegotiationRequest) -> dict[str, Any]:
    settings = get_settings()
    input_hash = hash_input(payload.model_dump())
    cache_key = f"negotiation:{input_hash}"

    if not payload.force_refresh:
        cached = get_cached(cache_key)
        if cached:
            cached = dict(cached)
            cached["from_cache"] = True
            return cached

    math: dict[str, Any] = {}
    if payload.offer_amount and payload.equity_pct:
        math["implied_valuation"] = implied_valuation(payload.offer_amount, payload.equity_pct)
        pre = math["implied_valuation"] - payload.offer_amount if math["implied_valuation"] else 0
        math["dilution"] = post_money_ownership(payload.offer_amount, max(pre, 0))

    runner = AgentRunner(max_calls=2)
    step = await run_negotiation_agent(
        runner,
        startup_name=payload.startup_name,
        investor_name=payload.investor_name,
        offer_amount=payload.offer_amount,
        equity_pct=payload.equity_pct,
    )

    result = WorkflowResult(
        workflow="negotiation",
        status="completed",
        provider=settings.ai_provider if not settings.demo_mode else "mock",
        demo_mode=settings.demo_mode,
        ai_calls=runner.tracker.calls,
        max_ai_calls=runner.tracker.max_calls,
        input_hash=input_hash,
        steps=[AgentStepResult(**{**step, "structured": math})],
        metrics=math,
        report=step["summary"],
    )
    data = result.model_dump()
    set_cached(cache_key, data)
    return data

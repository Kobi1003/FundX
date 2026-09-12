"""Deterministic tools for ADK / AgentRunner (search stubs + simulation)."""

from __future__ import annotations

from typing import Any

from app.schemas.requests import SimulationRequest
from app.schemas.thesis_extract import ThesisAssumptions
from app.simulation.sensitivity import run_sensitivity
from app.simulation.simulator import run_scenarios


def matching_score(startup_industries: list[str], investor_industries: list[str]) -> float:
    """Deterministic overlap score — no LLM."""
    if not startup_industries or not investor_industries:
        return 0.0
    a = {x.lower() for x in startup_industries}
    b = {x.lower() for x in investor_industries}
    inter = len(a & b)
    union = len(a | b)
    return round((inter / union) * 100, 2) if union else 0.0


def echo_structured_metrics(metrics: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "market_size",
        "growth_rate",
        "cac",
        "churn",
        "customers",
        "revenue",
        "marketing_budget",
        "operating_cost",
        "runway",
        "valuation",
    }
    return {k: metrics.get(k) for k in allowed if metrics.get(k) is not None}


def run_scenarios_tool(assumptions: dict[str, Any]) -> dict[str, Any]:
    """ADK-callable wrapper: never invent math — always use Python engine."""
    try:
        req = ThesisAssumptions.model_validate(assumptions).to_simulation_request()
    except Exception:
        req = SimulationRequest(**{k: v for k, v in assumptions.items() if k in SimulationRequest.model_fields})
    return run_scenarios(req)


def run_sensitivity_tool(assumptions: dict[str, Any], change: float = 0.10) -> list[dict[str, Any]]:
    try:
        req = ThesisAssumptions.model_validate(assumptions).to_simulation_request()
    except Exception:
        req = SimulationRequest(**{k: v for k, v in assumptions.items() if k in SimulationRequest.model_fields})
    return run_sensitivity(req, change=change)

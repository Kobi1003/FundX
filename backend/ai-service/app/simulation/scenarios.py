"""Scenario wrappers for bull/base/bear."""

from __future__ import annotations

from typing import Any

from app.schemas.requests import SimulationRequest
from app.simulation.assumptions import ALL_SCENARIOS, ScenarioAssumptions


def apply_scenario(request: SimulationRequest, scenario: ScenarioAssumptions) -> SimulationRequest:
    return SimulationRequest(
        current_revenue=request.current_revenue,
        current_customers=request.current_customers,
        growth_rate=request.growth_rate * scenario.growth_multiplier,
        cac=request.cac * scenario.cac_multiplier,
        churn=min(0.95, request.churn * scenario.churn_multiplier),
        pricing=request.pricing,
        marketing_spend=request.marketing_spend,
        operating_expenses=request.operating_expenses * scenario.opex_multiplier,
        funding=request.funding,
        months=request.months,
        valuation_multiple=request.valuation_multiple,
    )


def scenario_names() -> list[str]:
    return [s.name for s in ALL_SCENARIOS]

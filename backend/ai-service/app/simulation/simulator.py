"""Bull / base / bear simulator — pure Python math."""

from __future__ import annotations

from typing import Any

from app.schemas.requests import SimulationRequest
from app.simulation.assumptions import ALL_SCENARIOS
from app.simulation.cost_model import project_burn
from app.simulation.customer_model import project_customers
from app.simulation.dilution_model import post_money_ownership
from app.simulation.revenue_model import project_revenue
from app.simulation.runway_model import runway_months
from app.simulation.scenarios import apply_scenario
from app.simulation.valuation_model import revenue_multiple_valuation


def run_single(request: SimulationRequest) -> dict[str, Any]:
    revenues = project_revenue(request.current_revenue, request.growth_rate, request.months)
    customers = project_customers(
        request.current_customers,
        request.marketing_spend,
        request.cac,
        request.churn,
        request.months,
    )
    burns = project_burn(request.operating_expenses, request.marketing_spend, revenues)
    runway = runway_months(request.funding, burns)
    terminal_revenue = revenues[-1] if revenues else request.current_revenue
    annualized = terminal_revenue * 12
    valuation = revenue_multiple_valuation(annualized, request.valuation_multiple)
    funding_need = round(sum(burns), 2)
    dilution = post_money_ownership(request.funding, valuation) if request.funding else None

    # Simple score from runway + growth (not ML)
    score = min(100.0, max(0.0, (runway * 4) + (request.growth_rate * 40)))

    return {
        "projected_revenue": revenues,
        "customers": customers,
        "burn": burns,
        "runway_months": runway,
        "funding_requirement": funding_need,
        "valuation": valuation,
        "dilution": dilution,
        "score": round(score, 2),
    }


def run_scenarios(request: SimulationRequest) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for scenario in ALL_SCENARIOS:
        adjusted = apply_scenario(request, scenario)
        results[scenario.name] = run_single(adjusted)
    return {
        "inputs": request.model_dump(),
        "scenarios": results,
        "engine": "deterministic-python",
    }

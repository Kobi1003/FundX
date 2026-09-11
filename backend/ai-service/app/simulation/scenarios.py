"""Scenario wrappers for bull/base/bear deterministic simulation."""

from __future__ import annotations

from statistics import fmean, stdev

from app.schemas.requests import SimulationRequest
from app.simulation.assumptions import ALL_SCENARIOS, BASE, ScenarioAssumptions


def _scenario_value(values: list[float], fallback: float, name: str, lower_is_better: bool = False) -> tuple[float, bool]:
    """Use historical mean ± sample standard deviation when 3+ points exist."""
    if len(values) >= 3:
        mean, spread = fmean(values), stdev(values)
        if lower_is_better:
            val = mean - spread if name == "bull" else mean + spread if name == "bear" else mean
        else:
            val = mean + spread if name == "bull" else mean - spread if name == "bear" else mean
        return val, True
    return fallback, False


def apply_scenario(request: SimulationRequest, scenario: ScenarioAssumptions) -> SimulationRequest:
    data = request.model_dump()

    growth, _ = _scenario_value(
        request.historical_growth_rates,
        data["growth_rate"] * scenario.growth_multiplier,
        scenario.name,
        lower_is_better=False,
    )
    cac, _ = _scenario_value(
        request.historical_cac,
        data["cac"] * scenario.cac_multiplier,
        scenario.name,
        lower_is_better=True,
    )
    churn, _ = _scenario_value(
        request.historical_churn_rates,
        data["churn"] * scenario.churn_multiplier,
        scenario.name,
        lower_is_better=True,
    )
    arpu, _ = _scenario_value(
        request.historical_arpu,
        data["pricing"] * scenario.arpu_multiplier,
        scenario.name,
        lower_is_better=False,
    )
    margin, _ = _scenario_value(
        request.historical_gross_margins,
        data["starting_gross_margin"] + scenario.gross_margin_delta,
        scenario.name,
        lower_is_better=False,
    )

    data["growth_rate"] = max(-0.99, growth)
    if data["monthly_revenue_growth"] is not None:
        data["monthly_revenue_growth"] *= scenario.growth_multiplier
    if data["monthly_customer_growth"] is not None:
        data["monthly_customer_growth"] *= scenario.growth_multiplier

    data["cac"] = max(0.0, cac)
    data["churn"] = min(0.95, max(0.0, churn))
    data["pricing"] = max(0.0, arpu)
    data["starting_gross_margin"] = min(0.95, max(0.01, margin))

    # Fixed costs and operating expenses
    fixed_multiplier = scenario.fixed_costs_multiplier or scenario.opex_multiplier or 1.0
    for field in ("operating_expenses", "fixed_monthly_costs", "payroll_cost", "technology_cost", "administrative_cost", "other_costs"):
        if data[field] is not None:
            data[field] *= fixed_multiplier

    if data["marketing_spend"] is not None:
        data["marketing_spend"] *= scenario.marketing_multiplier

    return SimulationRequest(**data)


def scenario_method(request: SimulationRequest) -> str:
    series = (
        request.historical_growth_rates,
        request.historical_cac,
        request.historical_churn_rates,
        request.historical_arpu,
        request.historical_gross_margins,
    )
    return "historical_mean_plus_minus_standard_deviation" if any(len(values) >= 3 for values in series) else "benchmark_fallback"


def scenario_names() -> list[str]:
    return [s.name for s in ALL_SCENARIOS]

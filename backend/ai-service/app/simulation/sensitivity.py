"""One-way deterministic sensitivity analysis for key model assumptions."""
from __future__ import annotations

from app.schemas.requests import SimulationRequest
from app.simulation.simulator import run_single

_VARIABLES = ("cac", "churn", "operating_expenses", "starting_gross_margin", "pricing", "marketing_spend")


def run_sensitivity(request: SimulationRequest, change: float = 0.10) -> list[dict]:
    """Test +/- change per assumption and rank by absolute ending-cash impact."""
    baseline = run_single(request)
    results = []
    for variable in _VARIABLES:
        value = float(getattr(request, variable) or 0.0)
        if value <= 0.0:
            continue

        downside_value = value * (1.0 - change)
        upside_value = value * (1.0 + change)

        # Higher churn, CAC and opex are adverse (downside); higher margin/pricing/marketing are favorable (upside).
        if variable in {"cac", "churn", "operating_expenses"}:
            downside_value, upside_value = upside_value, downside_value

        # Enforce bounds
        if variable == "churn":
            downside_value = min(0.95, max(0.001, downside_value))
            upside_value = min(0.95, max(0.001, upside_value))
        elif variable == "starting_gross_margin":
            downside_value = min(0.99, max(0.01, downside_value))
            upside_value = min(0.99, max(0.01, upside_value))

        downside = request.model_copy(update={variable: downside_value})
        upside = request.model_copy(update={variable: upside_value})

        down_result, up_result = run_single(downside), run_single(upside)
        results.append({
            "variable": variable,
            "baseline": value,
            "downside": downside_value,
            "upside": upside_value,
            "downside_ending_cash": down_result["ending_cash"],
            "upside_ending_cash": up_result["ending_cash"],
            "impact_on_ending_cash": round(up_result["ending_cash"] - down_result["ending_cash"], 2),
            "impact_on_ending_arr": round(up_result["ending_arr"] - down_result["ending_arr"], 2),
            "impact_on_runway": {
                "downside": down_result["runway_months"],
                "upside": up_result["runway_months"],
            },
            "impact_on_additional_capital": round(
                down_result["additional_capital_required"] - up_result["additional_capital_required"],
                2,
            ),
        })

    return sorted(results, key=lambda item: abs(item["impact_on_ending_cash"]), reverse=True)

"""Auditable, mathematically unified deterministic startup financial simulation engine."""
from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4

from app.schemas.requests import SimulationRequest
from app.simulation.assumptions import ALL_SCENARIOS
from app.simulation.metrics import burn_multiple, ltv, ltv_cac_health, ratio
from app.simulation.scenarios import apply_scenario
from app.simulation.validation import validate_request
from app.simulation.valuation_model import funding_valuation, revenue_multiple_valuation

SIMULATION_ENGINE_VERSION = "2.0.0"


def _date_for_month(start: date | None, index: int) -> str | None:
    if not start:
        return None
    month = start.month - 1 + index
    year, month = start.year + month // 12, month % 12 + 1
    return date(year, month, min(start.day, monthrange(year, month)[1])).isoformat()


def _risk_flags(result: dict[str, Any], request: SimulationRequest, simulated_growth: float | None) -> list[dict[str, str]]:
    flags = []

    # Consistency Flag
    consistency = request.check_month0_consistency()
    if not consistency["is_consistent"]:
        flags.append({
            "severity": "CRITICAL",
            "metric": "input_consistency",
            "message": consistency["message"],
        })

    # Growth consistency flag
    if simulated_growth is not None and request.growth_rate > 0.05:
        if simulated_growth < request.growth_rate * 0.5:
            flags.append({
                "severity": "HIGH",
                "metric": "growth_unsupported",
                "message": (
                    f"Growth assumption ({request.growth_rate:.1%}) is not supported by current operating drivers "
                    f"(CAC ₹{request.cac:,.0f}, Churn {request.churn:.1%}, Marketing ₹{request.marketing_spend:,.0f} imply {simulated_growth:.1%} annual growth)."
                ),
            })

    # Runway & Solvency Flags
    if result["cash_out_month"] is not None:
        flags.append({
            "severity": "HIGH",
            "metric": "runway",
            "message": f"Projected cash exhaustion occurs in month {result['cash_out_month']}.",
        })

    if result["break_even_month"] is None:
        flags.append({
            "severity": "MEDIUM",
            "metric": "break_even",
            "message": "Break-even is not reached within the forecast horizon.",
        })

    if result["additional_capital_required"] > 0:
        flags.append({
            "severity": "HIGH",
            "metric": "capital",
            "message": f"Additional capital of ₹{result['additional_capital_required']:,.0f} is required to remain solvent through the forecast.",
        })

    if result["ltv_cac_health"] == "concerning":
        flags.append({
            "severity": "MEDIUM",
            "metric": "ltv_cac",
            "message": "LTV/CAC is below 1.0x.",
        })

    return flags


def _generate_red_team_summary(results: dict[str, Any], base_request: SimulationRequest) -> dict[str, Any]:
    bull = results.get("bull", {})
    base = results.get("base", {})
    bear = results.get("bear", {})

    insights = []

    # Check Month 0 Consistency
    consistency = base_request.check_month0_consistency()
    if not consistency["is_consistent"]:
        insights.append(
            f"CRITICAL WARNING: Reported MRR (₹{consistency['reported_mrr']:,.0f}) contradicts Customers × ARPU (₹{consistency['implied_mrr']:,.0f}). "
            f"The engine reconciled this using Customers × ARPU."
        )

    # Bear Stress
    if bear.get("cash_out_month"):
        insights.append(
            f"Under Bear headwinds (CAC +20%, Churn +30%, ARPU -10%, Margin -5pp), cash is exhausted at Month {bear['cash_out_month']} "
            f"requiring ₹{bear.get('additional_capital_required', 0):,.0f} in capital."
        )
    elif bear.get("ending_cash", 0) > 0 and bear.get("break_even_month") == 0:
        insights.append("Even under Bear headwinds, the company sustains positive cashflow due to strong gross margin and low fixed overhead.")

    # Base Performance
    if base.get("break_even_month") == 0:
        insights.append(f"Base case is already operating-profit positive at Month 0 (Starting MRR ₹{base.get('starting_mrr', 0):,.0f}).")
    elif base.get("break_even_month"):
        insights.append(
            f"Base case reaches operational break-even at Month {base['break_even_month']} (MRR ₹{base.get('revenue_at_break_even', 0):,.0f})."
        )
    else:
        insights.append("Base case does not reach break-even within the forecast horizon.")

    # Bull Upside
    if bull.get("ending_arr") and base.get("ending_arr") and base.get("ending_arr") > 0:
        upside = ((bull["ending_arr"] - base["ending_arr"]) / base["ending_arr"]) * 100
        insights.append(
            f"Bull case unlocks {upside:.1f}% ARR upside over Base (ending at ₹{bull['ending_arr']:,.0f} ARR) "
            f"driven by customer acquisition efficiency and lower churn."
        )

    return {
        "summary": " ".join(insights),
        "key_vulnerability": "The startup's solvency and runway are driven by CAC efficiency, customer churn rate, and gross margin retention.",
        "input_consistency": consistency,
        "scenarios_breakdown": {
            "bull": {
                "label": "Bull Case (High Efficiency & Expansion)",
                "ending_arr": bull.get("ending_arr"),
                "ending_mrr": bull.get("ending_mrr"),
                "ending_customers": bull.get("ending_customers"),
                "break_even_month": bull.get("break_even_month"),
                "break_even_status": bull.get("break_even_status"),
                "runway_months": bull.get("runway_months"),
                "runway_status": bull.get("runway_status"),
                "ending_cash": bull.get("ending_cash"),
                "additional_capital_required": bull.get("additional_capital_required", 0),
            },
            "base": {
                "label": "Base Case (Expected Performance)",
                "ending_arr": base.get("ending_arr"),
                "ending_mrr": base.get("ending_mrr"),
                "ending_customers": base.get("ending_customers"),
                "break_even_month": base.get("break_even_month"),
                "break_even_status": base.get("break_even_status"),
                "runway_months": base.get("runway_months"),
                "runway_status": base.get("runway_status"),
                "ending_cash": base.get("ending_cash"),
                "additional_capital_required": base.get("additional_capital_required", 0),
            },
            "bear": {
                "label": "Bear Case (Headwinds & Inefficiency)",
                "ending_arr": bear.get("ending_arr"),
                "ending_mrr": bear.get("ending_mrr"),
                "ending_customers": bear.get("ending_customers"),
                "break_even_month": bear.get("break_even_month"),
                "break_even_status": bear.get("break_even_status"),
                "runway_months": bear.get("runway_months"),
                "runway_status": bear.get("runway_status"),
                "ending_cash": bear.get("ending_cash"),
                "additional_capital_required": bear.get("additional_capital_required", 0),
            },
        },
    }


def run_single(request: SimulationRequest, scenario_name: str = "base") -> dict[str, Any]:
    """Run an auditable, deterministic monthly forecast.

    Primary revenue model:
        MRR_t = Ending_Customers_t * ARPU_t
        ARR_t = MRR_t * 12
    """
    validate_request(request)

    # Initialize Starting Baseline (Month 0)
    customers = float(request.current_customers)
    arpu = float(request.pricing)
    if arpu == 0.0 and customers > 0 and request.current_revenue > 0:
        arpu = float(request.current_revenue / customers)
    elif customers == 0.0 and arpu > 0 and request.current_revenue > 0:
        customers = float(round(request.current_revenue / arpu))

    # Authoritative Month 0 MRR
    m0 = customers * arpu if (customers > 0 and arpu > 0) else float(request.current_revenue)
    initial_cash = float(request.funding)
    cash = initial_cash

    gross_margin = float(request.starting_gross_margin)
    fixed = float(request.fixed_monthly_costs if request.fixed_monthly_costs is not None else request.operating_expenses)
    marketing = float(request.marketing_spend)
    cac = float(request.cac)
    churn = float(request.churn)

    # Check Month 0 Break-Even status
    m0_gross_profit = m0 * gross_margin
    m0_initial_opex = fixed + marketing + request.payroll_cost + request.technology_cost + request.administrative_cost + request.other_costs
    m0_operating_profit = m0_gross_profit - m0_initial_opex

    break_even: dict[str, Any] | None = None
    if m0_operating_profit >= 0:
        break_even = {
            "month": 0,
            "date": _date_for_month(request.starting_month, 0),
            "revenue": round(m0, 2),
            "customers": round(customers, 2),
            "status": "already profitable at Month 0",
        }

    forecast: list[dict[str, Any]] = []
    cumulative_burn = 0.0
    cash_out_month: int | None = None

    for month in range(1, request.months + 1):
        starting_customers = customers

        # 1. Customer Acquisition via Marketing & CAC
        effective_cac = cac * ((1 + request.cac_change_rate) ** (month - 1)) if request.cac_change_rate else cac
        if request.new_customers_per_month is not None:
            new_customers = float(request.new_customers_per_month)
        elif effective_cac > 0 and marketing > 0:
            new_customers = marketing / effective_cac
        else:
            new_customers = 0.0

        # 2. Customer Churn
        churned_customers = starting_customers * churn

        # 3. Ending Customers
        customers = max(0.0, starting_customers + new_customers - churned_customers)
        net_customer_growth = customers - starting_customers

        # 4. ARPU Evolution
        if request.arpu_growth_rate:
            arpu *= 1 + request.arpu_growth_rate

        # 5. Authoritative MRR & ARR (MRR = Ending Customers * ARPU)
        mrr = customers * arpu
        arr = mrr * 12.0

        # Prior MRR for growth calculation
        prior_mrr = forecast[-1]["mrr"] if forecast else m0
        revenue_growth_rate = ((mrr / prior_mrr) - 1.0) if prior_mrr > 0 else 0.0

        # 6. Unit Economics & LTV
        current_ltv = ltv(arpu, gross_margin, churn, request.max_lifetime_months)
        ltv_cac = ratio(current_ltv, effective_cac) if effective_cac > 0 else None

        # 7. P&L: Gross Profit & OPEX
        gross_profit = mrr * gross_margin
        payroll = request.payroll_cost + sum(
            p.monthly_salary * p.headcount for p in request.hiring_plan if p.hiring_month <= month
        )
        variable_costs = request.variable_cost_per_customer * customers
        opex = (
            fixed
            + marketing
            + payroll
            + request.technology_cost
            + request.administrative_cost
            + request.other_costs
            + variable_costs
            + request.sales_budget
        )
        operating_profit = gross_profit - opex
        burn = max(0.0, -operating_profit)
        cumulative_burn += burn

        # 8. Cashflow
        financing = (
            request.funding_round.investment_amount
            if request.funding_round and request.funding_round.investment_month == month
            else 0.0
        )
        starting_cash = cash
        cash = cash + financing + operating_profit

        # 9. Insolvency & Break-Even Tracking
        if cash_out_month is None and cash <= 0:
            cash_out_month = month

        if break_even is None and operating_profit >= 0:
            break_even = {
                "month": month,
                "date": _date_for_month(request.starting_month, month - 1),
                "revenue": round(mrr, 2),
                "customers": round(customers, 2),
                "status": f"reached in month {month}",
            }

        forecast.append({
            "month": month,
            "date": _date_for_month(request.starting_month, month - 1),
            "starting_customers": round(starting_customers, 2),
            "new_customers": round(new_customers, 2),
            "churned_customers": round(churned_customers, 2),
            "ending_customers": round(customers, 2),
            "net_customer_growth": round(net_customer_growth, 2),
            "retention_rate": round(1.0 - churn, 4),
            "arpu": round(arpu, 2),
            "mrr": round(mrr, 2),
            "revenue": round(mrr, 2),
            "arr": round(arr, 2),
            "revenue_growth_rate": round(revenue_growth_rate, 6),
            "cac": round(effective_cac, 2) if effective_cac > 0 else None,
            "marketing_spend": round(marketing, 2),
            "ltv": current_ltv,
            "ltv_cac_ratio": ltv_cac,
            "gross_margin": round(gross_margin, 4),
            "gross_profit": round(gross_profit, 2),
            "fixed_costs": round(fixed, 2),
            "operating_expenses": round(opex, 2),
            "total_costs": round(opex, 2),
            "operating_profit": round(operating_profit, 2),
            "burn": round(burn, 2),
            "cumulative_burn": round(cumulative_burn, 2),
            "financing_inflow": round(financing, 2),
            "starting_cash": round(starting_cash, 2),
            "ending_cash": round(cash, 2),
            "cash_out_status": f"Cash-out (Month {month})" if cash <= 0 else "Solvent",
            "break_even_status": "Profitable" if operating_profit >= 0 else "Burning",
        })

    terminal = forecast[-1] if forecast else {}
    min_cash = min([initial_cash] + [item["ending_cash"] for item in forecast])
    additional_capital_required = round(max(0.0, -min_cash), 2)

    # Simulated Annualized Growth Calculation
    if m0 > 0 and terminal.get("mrr", 0) > 0 and request.months > 0:
        simulated_annual_growth = ((terminal["mrr"] / m0) ** (12.0 / request.months)) - 1.0
    else:
        simulated_annual_growth = 0.0

    # Runway Status Text
    if cash_out_month is not None:
        runway_status = f"cash-out in month {cash_out_month}"
        runway_display = f"{cash_out_month} mo"
    elif all(f["operating_profit"] >= 0 for f in forecast):
        runway_status = "cash-flow positive / runway not constrained"
        runway_display = f"{request.months}+ months (Profitable)"
    else:
        runway_status = f"not constrained within forecast horizon ({request.months}+ months)"
        runway_display = f"{request.months}+ months"

    valuation, funding_data = (
        revenue_multiple_valuation(terminal.get("arr", 0), request.valuation_multiple),
        funding_valuation(request.funding_round) if request.funding_round else None,
    )

    result: dict[str, Any] = {
        "scenario": scenario_name,
        "scenario_probability": None,
        "forecast_months": request.months,
        "starting_mrr": round(m0, 2),
        "starting_arr": round(m0 * 12.0, 2),
        "starting_cash": round(initial_cash, 2),
        "starting_customers": int(round(customers if request.months == 0 else float(request.current_customers))),
        "starting_arpu": round(float(request.pricing), 2),
        "monthly_forecast": forecast,
        "projected_revenue": [r["revenue"] for r in forecast],
        "customers": [round(r["ending_customers"]) for r in forecast],
        "burn": [r["burn"] for r in forecast],
        "ending_revenue": terminal.get("revenue", m0),
        "ending_mrr": terminal.get("mrr", m0),
        "ending_arr": terminal.get("arr", m0 * 12.0),
        "ending_customers": terminal.get("ending_customers", customers),
        "ending_cash": terminal.get("ending_cash", initial_cash),
        "total_burn": round(cumulative_burn, 2),
        "cash_out_month": cash_out_month,
        "runway_months": cash_out_month,
        "runway_status": runway_status,
        "runway_display": runway_display,
        "additional_capital_required": additional_capital_required,
        "break_even_month": break_even["month"] if break_even else None,
        "break_even_date": break_even["date"] if break_even else None,
        "revenue_at_break_even": break_even.get("revenue") if break_even else None,
        "customers_at_break_even": break_even.get("customers") if break_even else None,
        "break_even_status": break_even["status"] if break_even else "not reached within forecast horizon",
        "simulated_annual_growth": round(simulated_annual_growth, 4),
        "ltv": terminal.get("ltv"),
        "cac": terminal.get("cac"),
        "ltv_cac_ratio": terminal.get("ltv_cac_ratio"),
        "ltv_cac_health": ltv_cac_health(terminal.get("ltv_cac_ratio")),
        "valuation": valuation,
        "funding_valuation": funding_data,
        "dilution": funding_data,
        "funding_requirement": additional_capital_required,
        "score": round(
            min(100, max(0, (request.months if cash_out_month is None else cash_out_month) * 3 + (1 - min(1.0, churn * 10)) * 40)),
            2,
        ),
        "unit_economics": {
            "burn_multiple": burn_multiple(
                terminal.get("burn", 0),
                max(0, terminal.get("arr", 0) - (forecast[-2]["arr"] if len(forecast) > 1 else m0 * 12)),
            ),
            "gross_margin": gross_margin,
            "cac": cac,
            "churn": churn,
            "arpu": arpu,
        },
    }

    result["risk_flags"] = _risk_flags(result, request, simulated_growth=simulated_annual_growth)
    return result


def run_scenarios(request: SimulationRequest) -> dict[str, Any]:
    """Run Bull, Base, and Bear scenarios deterministically from identical Month 0 reality."""
    # Verified mode updates explicitly supplied verified facts
    effective_request = request
    if request.simulation_case == "verified":
        allowed = {
            "current_revenue", "current_mrr", "current_arr", "current_customers",
            "cac", "churn", "pricing", "starting_gross_margin", "funding",
            "operating_expenses", "marketing_spend",
        }
        updates = {
            name: metric.verified_value
            for name, metric in request.verification_metrics.items()
            if name in allowed and metric.verified_value is not None
        }
        if "current_revenue" in updates and request.current_mrr is not None:
            updates["current_mrr"] = updates["current_revenue"]
        if updates:
            effective_request = SimulationRequest(**{**request.model_dump(), **updates})

    # Run each scenario through the deterministic engine
    results = {s.name: run_single(apply_scenario(effective_request, s), s.name) for s in ALL_SCENARIOS}
    base = results["base"]

    headline = (
        f"Base case reaches break-even in month {base['break_even_month']}."
        if base["break_even_month"] is not None and base["break_even_month"] > 0
        else "Base case is already profitable at Month 0."
        if base["break_even_month"] == 0
        else "Base case does not reach break-even within the forecast horizon."
    )
    if base["additional_capital_required"] > 0:
        headline += f" Additional capital required: ₹{base['additional_capital_required']:,.0f}."

    red_team = _generate_red_team_summary(results, effective_request)

    return {
        "simulation_id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "engine": "deterministic-python",
        "engine_version": SIMULATION_ENGINE_VERSION,
        "disclaimer": "Scenario-based projections calculated deterministically from operating drivers; not financial advice.",
        "inputs": request.model_dump(mode="json"),
        "effective_inputs": effective_request.model_dump(mode="json"),
        "scenarios": results,
        "summary": {
            "headline": headline,
            "health": base["ltv_cac_health"],
            "key_metrics": {
                "ending_arr": base["ending_arr"],
                "ending_cash": base["ending_cash"],
                "runway_months": base["runway_months"],
                "runway_display": base["runway_display"],
            },
            "scenario_comparison": {
                n: {
                    "ending_arr": r["ending_arr"],
                    "ending_cash": r["ending_cash"],
                    "ending_customers": r["ending_customers"],
                    "break_even_month": r["break_even_month"],
                    "break_even_status": r["break_even_status"],
                    "runway_display": r["runway_display"],
                    "additional_capital_required": r["additional_capital_required"],
                }
                for n, r in results.items()
            },
            "red_team_analysis": red_team,
            "risk_flags": base["risk_flags"],
        },
    }

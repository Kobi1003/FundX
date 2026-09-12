"""
AI Thesis Analyzer — hybrid ADK/AgentRunner extract + deterministic simulation.

LLM interprets & extracts assumptions / narrative. Python simulates Bull/Base/Bear.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from shared.config import get_settings

from app.agents.orchestrator import AgentRunner, run_adk_or_fallback
from app.schemas.thesis_extract import enrich_revenue_valuation
from app.simulation.sensitivity import run_sensitivity
from app.simulation.simulator import run_scenarios


async def run_thesis_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    pitch = payload.get("pitch") or payload.get("title") or "Innovative Platform"
    thesis = payload.get("thesis_text") or payload.get("thesis") or ""
    stage = payload.get("funding_stage") or payload.get("stage") or "Seed"
    amount = float(payload.get("amount") or payload.get("target_raise") or 500000)
    equity_pct = float(payload.get("equity_pct") or 7.5)
    royalty_pct = float(payload.get("royalty_pct") or 3.0)
    royalty_payout = (
        payload.get("royalty_payout")
        or payload.get("royalty_payout_terms")
        or "3% quarterly gross revenue until 2.0x cap"
    )
    industry = payload.get("industry") or "SaaS / Technology"
    run_full = payload.get("run_full_simulation", True)

    company_meta = {
        **payload,
        "pitch": pitch,
        "industry": industry,
        "stage": stage,
        "funding_stage": stage,
        "amount": amount,
        "company_name": payload.get("company_name") or payload.get("name") or pitch,
    }

    extract = await run_adk_or_fallback(thesis, company_meta)
    assumptions = extract["assumptions"]
    # Prefer payload industry/stage when extract is generic
    if industry:
        assumptions.industry = industry
    if stage:
        assumptions.stage = stage
    if pitch and assumptions.company_name in ("Untitled Startup", ""):
        assumptions.company_name = str(pitch)[:120]

    future_analysis = extract["future_analysis"]

    # Heuristic feasibility score blended with agent score
    base_score = int(future_analysis.feasibility.score or 65)
    thesis_len = len(thesis.strip())
    if thesis_len > 600:
        base_score = min(95, base_score + 5)
    elif thesis_len < 80:
        base_score = max(45, base_score - 8)
    if 5.0 <= equity_pct <= 20.0:
        base_score = min(95, base_score + 2)
    feasibility_score = max(45, min(95, base_score))
    future_analysis.feasibility.score = feasibility_score
    future_analysis.feasibility.grade = (
        "A" if feasibility_score >= 85 else ("B+" if feasibility_score >= 75 else "B")
    )

    sim_req = assumptions.to_simulation_request()
    sim_raw = run_scenarios(sim_req) if run_full else {"scenarios": {}}
    scenarios = sim_raw.get("scenarios", {})
    sensitivity = run_sensitivity(sim_req) if run_full else []

    future_analysis = enrich_revenue_valuation(future_analysis, scenarios, assumptions.valuation_multiple)

    def _card(name: str, label: str) -> dict[str, Any]:
        s = scenarios.get(name, {})
        ending_arr = s.get("ending_arr")
        if ending_arr is None:
            rev = s.get("projected_revenue") or [0]
            ending_arr = (rev[-1] if rev else 0) * 12
        return {
            "name": label,
            "annual_revenue": round(float(ending_arr or 0), 2),
            "ending_arr": s.get("ending_arr"),
            "ending_mrr": s.get("ending_mrr"),
            "ending_cash": s.get("ending_cash"),
            "ending_customers": s.get("ending_customers"),
            "runway_months": s.get("runway_months"),
            "runway_display": s.get("runway_display"),
            "projected_users": s.get("ending_customers")
            or ((s.get("customers") or [0])[-1] if s.get("customers") else 0),
            "valuation": s.get("valuation"),
            "score": s.get("score"),
            "net_margin_m12_pct": None,
        }

    simulation = {
        "bull": _card("bull", "Bull Case (High Market Adoption)"),
        "base": _card("base", "Base Case (Target Plan)"),
        "bear": _card("bear", "Bear Case (Conservative / Headwinds)"),
        "engine": "deterministic-python",
    }

    pre_money = round(amount / (equity_pct / 100.0) - amount, 2) if equity_pct else None

    pain_points = [
        {
            "category": "Cash Flow & Unit Economics",
            "severity": "Medium" if royalty_pct <= 4.0 else "High",
            "issue": (
                f"Royalty commitment of {royalty_pct}% on gross revenues requires healthy margins "
                "to avoid early cash constraints."
            ),
            "mitigation": "Structure royalty deferral for the first 1–2 quarters if needed.",
        },
        {
            "category": "Customer Acquisition Payback",
            "severity": "Medium",
            "issue": (
                f"Market dynamics in {industry} often imply 9–14 month CAC payback, "
                "which can strain burn without reserved growth capital."
            ),
            "mitigation": "Allocate a defined share of the round to measurable acquisition channels.",
        },
        {
            "category": "Valuation & Dilution Alignment",
            "severity": "Low" if equity_pct <= 12.0 else "Medium",
            "issue": (
                f"Offering {equity_pct}% equity for ${amount:,.0f} implies pre-money ~"
                f"${pre_money:,.0f}."
                if pre_money is not None
                else "Equity terms need clarification."
            ),
            "mitigation": "Tie next-round step-up to clear traction milestones in the thesis.",
        },
    ]
    for risk in future_analysis.feasibility.risks[:3]:
        pain_points.append(
            {
                "category": "Thesis Feasibility",
                "severity": "Medium",
                "issue": risk,
                "mitigation": "Validate with pilots, LOIs, or third-party market data.",
            }
        )

    strengths = list(future_analysis.feasibility.strengths) or [
        f"Hybrid equity ({equity_pct}%) + royalty ({royalty_pct}%) can improve investor downside liquidity.",
        f"Industry context: {industry} with stage={stage}.",
    ]
    strengths.append(
        f"Target raise of ${amount:,.0f} modeled with deterministic {assumptions.months}-month simulation."
    )

    recommendations = [
        "Specify a royalty repayment cap (e.g. 1.8x–2.0x) in payout terms.",
        "Add pilot metrics or LOIs to strengthen claim evidence.",
        "Open results in Financial Simulator to stress-test CAC, churn, and growth.",
    ]

    insights = None
    settings = get_settings()
    try:
        runner = AgentRunner(max_calls=1)
        step = await runner.call_agent(
            "investment_analyst",
            (
                f"Startup pitch: {pitch}. Industry: {industry}. Stage: {stage}. "
                f"Thesis excerpt: {thesis[:1200]}. Feasibility score: {feasibility_score}. "
                f"Base ending ARR: {future_analysis.revenue_valuation.base_arr}. "
                "Give 3 concise investor-facing insights and 2 diligence questions."
            ),
            system="You produce short investor insights. Do not invent exact financial math.",
        )
        insights = step.get("summary")
    except Exception as exc:  # noqa: BLE001
        insights = f"Insight agent unavailable ({exc}); using structured findings only."

    extracted = assumptions.model_dump()
    form_drivers = assumptions.to_simulator_form()

    return {
        "status": "completed",
        "feasibility_score": feasibility_score,
        "score_grade": future_analysis.feasibility.grade,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "pitch": pitch,
        "industry": industry,
        "stage": stage,
        "thesis_excerpt": thesis[:500],
        "extracted_assumptions": extracted,
        "simulator_form": form_drivers,
        "future_analysis": future_analysis.model_dump(),
        "simulation": simulation,
        "scenarios": scenarios,
        "sensitivity": sensitivity,
        "simulation_detail": sim_raw,
        "pain_points": pain_points,
        "strengths": strengths,
        "recommendations": recommendations,
        "insights": insights,
        "engine_path": extract.get("engine_path"),
        "provider": "mock" if settings.demo_mode else settings.ai_provider,
        "can_publish": feasibility_score >= 60,
        "summary": (
            f"AI Feasibility Analysis score {feasibility_score}/100. "
            + (
                f"Base-case ending ARR ~₹{future_analysis.revenue_valuation.base_arr:,.0f}."
                if future_analysis.revenue_valuation.base_arr is not None
                else "Open Financial Simulator to explore Bull/Base/Bear."
            )
        ),
    }

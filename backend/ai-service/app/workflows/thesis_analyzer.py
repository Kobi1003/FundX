"""
AI Thesis Analyzer — hybrid deterministic scoring + optional LLM insight.

Math comes from Python simulation. Narrative insights optionally use AgentRunner
(Mock / Gemini / Groq) — never invents valuation math via LLM.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from shared.config import get_settings

from app.agents.orchestrator import AgentRunner
from app.schemas.requests import SimulationRequest
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
    metrics = payload.get("metrics") or {}

    base_score = 65
    thesis_len = len(thesis.strip())
    if thesis_len > 600:
        base_score += 15
    elif thesis_len > 250:
        base_score += 10
    elif thesis_len > 80:
        base_score += 5

    if 5.0 <= equity_pct <= 20.0:
        base_score += 5
    if 1.0 <= royalty_pct <= 6.0:
        base_score += 5
    if any(k in royalty_payout.lower() for k in ("cap", "multiple", "until")):
        base_score += 4

    feasibility_score = max(45, min(95, base_score))

    sim_req = SimulationRequest(
        current_revenue=float(metrics.get("revenue") or amount * 0.04),
        current_customers=int(metrics.get("customers") or 100),
        growth_rate=float(metrics.get("growth_rate") or 0.18),
        cac=float(metrics.get("cac") or 400),
        churn=float(metrics.get("churn") or 0.05),
        marketing_spend=float(metrics.get("marketing_budget") or amount * 0.15),
        operating_expenses=float(metrics.get("operating_cost") or amount / 18.0),
        funding=amount,
        months=12,
    )
    sim_raw = run_scenarios(sim_req)
    scenarios = sim_raw.get("scenarios", {})

    def _card(name: str, label: str) -> dict[str, Any]:
        s = scenarios.get(name, {})
        rev = s.get("projected_revenue") or [0]
        return {
            "name": label,
            "annual_revenue": round((rev[-1] if rev else 0) * 12, 2),
            "runway_months": s.get("runway_months"),
            "projected_users": (s.get("customers") or [0])[-1] if s.get("customers") else 0,
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
                f"${pre_money:,.0f}." if pre_money is not None else "Equity terms need clarification."
            ),
            "mitigation": "Tie next-round step-up to clear traction milestones in the thesis.",
        },
    ]

    strengths = [
        f"Hybrid equity ({equity_pct}%) + royalty ({royalty_pct}%) can improve investor downside liquidity.",
        f"Industry context: {industry} with stage={stage}.",
        f"Target raise of ${amount:,.0f} is modeled against a 12-month deterministic runway simulation.",
    ]

    recommendations = [
        "Specify a royalty repayment cap (e.g. 1.8x–2.0x) in payout terms.",
        "Add pilot metrics or LOIs to strengthen claim evidence.",
        "Document competitive moat explicitly (switching costs, data, distribution).",
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
                f"Base runway months: {simulation['base'].get('runway_months')}. "
                "Give 3 concise investor-facing insights and 2 diligence questions."
            ),
            system="You produce short investor insights. Do not invent exact financial math.",
        )
        insights = step.get("summary")
    except Exception as exc:  # noqa: BLE001
        insights = f"Insight agent unavailable ({exc}); using structured findings only."

    return {
        "status": "completed",
        "feasibility_score": feasibility_score,
        "score_grade": "A" if feasibility_score >= 85 else ("B+" if feasibility_score >= 75 else "B"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "pitch": pitch,
        "industry": industry,
        "stage": stage,
        "simulation": simulation,
        "simulation_detail": sim_raw,
        "pain_points": pain_points,
        "strengths": strengths,
        "recommendations": recommendations,
        "insights": insights,
        "provider": "mock" if settings.demo_mode else settings.ai_provider,
        "can_publish": feasibility_score >= 60,
        "summary": (
            f"AI Feasibility Analysis score {feasibility_score}/100. "
            f"Base-case modeled annualized revenue ~"
            f"${simulation['base']['annual_revenue']:,.0f} (deterministic engine)."
        ),
    }

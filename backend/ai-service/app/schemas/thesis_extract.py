"""Thesis → structured assumptions + future analysis schemas."""

from __future__ import annotations

import json
import re
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.schemas.requests import SimulationRequest


class CompetitionAnalysis(BaseModel):
    summary: str = ""
    competitors: list[str] = Field(default_factory=list)
    moat: str = ""


class FeasibilityAnalysis(BaseModel):
    score: int = Field(default=70, ge=0, le=100)
    grade: str = "B"
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)

    @field_validator("grade", mode="before")
    @classmethod
    def _grade(cls, v: Any) -> str:
        return str(v or "B")


class MarketTrendAnalysis(BaseModel):
    tam_sam_som: str = ""
    trend: str = ""
    timing: str = ""


class RevenueValuationAnalysis(BaseModel):
    base_arr: float | None = None
    bull_arr: float | None = None
    bear_arr: float | None = None
    implied_valuation: float | None = None
    method: str = "ARR × valuation_multiple (deterministic engine)"


class FutureAnalysis(BaseModel):
    competition: CompetitionAnalysis = Field(default_factory=CompetitionAnalysis)
    feasibility: FeasibilityAnalysis = Field(default_factory=FeasibilityAnalysis)
    market_trend: MarketTrendAnalysis = Field(default_factory=MarketTrendAnalysis)
    revenue_valuation: RevenueValuationAnalysis = Field(default_factory=RevenueValuationAnalysis)


class ThesisAssumptions(BaseModel):
    """Numeric drivers extracted from a thesis for the finance simulator."""

    company_name: str = "Untitled Startup"
    industry: str | None = "SaaS / Technology"
    stage: str | None = "Seed"
    current_mrr: float = Field(default=400_000, ge=0)
    funding: float = Field(default=25_000_000, ge=0)
    current_customers: int = Field(default=80, ge=0)
    pricing: float = Field(default=5_000, ge=0)
    cac: float = Field(default=18_000, ge=0)
    churn: float = Field(default=0.035, ge=0, lt=1)
    marketing_spend: float = Field(default=180_000, ge=0)
    growth_rate: float = Field(default=1.0, ge=-0.99)
    starting_gross_margin: float = Field(default=0.68, ge=0, le=1)
    operating_expenses: float = Field(default=600_000, ge=0)
    months: int = Field(default=18, ge=1, le=60)
    valuation_multiple: float = Field(default=10.0, ge=0)
    growth_decay_rate: float = Field(default=0.015, ge=0, lt=1)

    def to_simulation_request(self) -> SimulationRequest:
        return SimulationRequest(
            company_name=self.company_name,
            industry=self.industry,
            stage=self.stage,
            current_mrr=self.current_mrr,
            current_revenue=self.current_mrr,
            funding=self.funding,
            starting_cash=self.funding,
            current_customers=self.current_customers,
            pricing=self.pricing,
            cac=self.cac,
            churn=self.churn,
            marketing_spend=self.marketing_spend,
            growth_rate=self.growth_rate,
            starting_gross_margin=self.starting_gross_margin,
            operating_expenses=self.operating_expenses,
            months=self.months,
            valuation_multiple=self.valuation_multiple,
            growth_decay_rate=self.growth_decay_rate,
            authoritative_mrr_basis="reported_mrr",
        )

    def to_simulator_form(self) -> dict[str, Any]:
        """Shape consumed by frontend SimulationPage form state."""
        return {
            "company_name": self.company_name,
            "industry": self.industry or "SaaS / Technology",
            "stage": self.stage or "Seed",
            "current_mrr": self.current_mrr,
            "funding": self.funding,
            "current_customers": self.current_customers,
            "pricing": self.pricing,
            "cac": self.cac,
            "marketing_spend": self.marketing_spend,
            "growth_rate": self.growth_rate,
            "churn": self.churn,
            "starting_gross_margin": self.starting_gross_margin,
            "operating_expenses": self.operating_expenses,
            "growth_decay_rate": self.growth_decay_rate,
            "months": self.months,
            "investment_amount": 0,
            "equity_percentage": 0.18,
            "investment_month": 6,
            "valuation_multiple": self.valuation_multiple,
        }


def parse_json_object(text: str) -> dict[str, Any]:
    """Best-effort extract of a JSON object from model text."""
    if not text:
        return {}
    text = text.strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}
    try:
        data = json.loads(match.group(0))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def assumptions_from_payload(payload: dict[str, Any], metrics: dict[str, Any] | None = None) -> ThesisAssumptions:
    """Build assumptions from request metrics / defaults (demo & heuristic path)."""
    metrics = metrics or payload.get("metrics") or {}
    amount = float(payload.get("amount") or payload.get("target_raise") or 2_500_000)
    name = (
        payload.get("company_name")
        or payload.get("name")
        or payload.get("pitch")
        or payload.get("title")
        or "Untitled Startup"
    )
    industry = payload.get("industry") or "SaaS / Technology"
    stage = payload.get("funding_stage") or payload.get("stage") or "Seed"

    customers = int(metrics.get("customers") or metrics.get("current_customers") or 80)
    pricing = float(metrics.get("pricing") or metrics.get("arpu") or 5_000)
    mrr = float(
        metrics.get("current_mrr")
        or metrics.get("mrr")
        or metrics.get("revenue")
        or (customers * pricing if customers and pricing else 400_000)
    )
    funding = float(metrics.get("funding") or metrics.get("starting_cash") or max(amount, 2_500_000))

    return ThesisAssumptions(
        company_name=str(name)[:120],
        industry=industry,
        stage=stage,
        current_mrr=mrr,
        funding=funding,
        current_customers=customers,
        pricing=pricing,
        cac=float(metrics.get("cac") or 18_000),
        churn=float(metrics.get("churn") or 0.035),
        marketing_spend=float(metrics.get("marketing_spend") or metrics.get("marketing_budget") or 180_000),
        growth_rate=float(metrics.get("growth_rate") or 1.0),
        starting_gross_margin=float(metrics.get("starting_gross_margin") or metrics.get("gross_margin") or 0.68),
        operating_expenses=float(metrics.get("operating_expenses") or metrics.get("operating_cost") or 600_000),
        months=int(metrics.get("months") or 18),
        valuation_multiple=float(metrics.get("valuation_multiple") or 10.0),
        growth_decay_rate=float(metrics.get("growth_decay_rate") or 0.015),
    )


def merge_assumption_dict(base: ThesisAssumptions, overlay: dict[str, Any]) -> ThesisAssumptions:
    data = base.model_dump()
    for key, value in (overlay or {}).items():
        if key in data and value is not None and value != "":
            data[key] = value
    return ThesisAssumptions.model_validate(data)


def future_analysis_from_dicts(
    *,
    competition: dict[str, Any] | None = None,
    feasibility: dict[str, Any] | None = None,
    market_trend: dict[str, Any] | None = None,
    revenue_valuation: dict[str, Any] | None = None,
) -> FutureAnalysis:
    return FutureAnalysis(
        competition=CompetitionAnalysis.model_validate(competition or {}),
        feasibility=FeasibilityAnalysis.model_validate(feasibility or {}),
        market_trend=MarketTrendAnalysis.model_validate(market_trend or {}),
        revenue_valuation=RevenueValuationAnalysis.model_validate(revenue_valuation or {}),
    )


def enrich_revenue_valuation(fa: FutureAnalysis, scenarios: dict[str, Any], multiple: float) -> FutureAnalysis:
    """Fill ARR / valuation from deterministic scenario outputs."""
    def _arr(name: str) -> float | None:
        s = scenarios.get(name) or {}
        if s.get("ending_arr") is not None:
            return float(s["ending_arr"])
        rev = s.get("projected_revenue") or []
        if rev:
            return float(rev[-1]) * 12
        return None

    base_arr = _arr("base")
    bull_arr = _arr("bull")
    bear_arr = _arr("bear")
    implied = round(base_arr * multiple, 2) if base_arr is not None else None
    fa.revenue_valuation = RevenueValuationAnalysis(
        base_arr=base_arr,
        bull_arr=bull_arr,
        bear_arr=bear_arr,
        implied_valuation=implied,
        method=f"Ending ARR × {multiple}x (deterministic Python engine)",
    )
    return fa

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class StructuredMetrics(BaseModel):
    """Structured fields agents should prefer over giant free-text reports."""

    market_size: float | None = None
    growth_rate: float | None = None
    cac: float | None = None
    churn: float | None = None
    customers: int | None = None
    revenue: float | None = None
    marketing_budget: float | None = None
    operating_cost: float | None = None
    runway: float | None = None
    valuation: float | None = None


class StartupAnalysisRequest(BaseModel):
    startup_id: str | None = None
    name: str = "Untitled Startup"
    industry: str | None = None
    stage: str | None = None
    thesis: str | None = None
    document_summaries: list[str] = Field(default_factory=list)
    metrics: StructuredMetrics = Field(default_factory=StructuredMetrics)
    force_refresh: bool = False


class InvestorAnalysisRequest(BaseModel):
    investor_id: str | None = None
    display_name: str = "Investor"
    firm: str | None = None
    thesis: str | None = None
    preferences: dict[str, Any] = Field(default_factory=dict)
    document_summaries: list[str] = Field(default_factory=list)
    force_refresh: bool = False


class NegotiationRequest(BaseModel):
    deal_id: str | None = None
    room_id: str | None = None
    startup_name: str = "Startup"
    investor_name: str = "Investor"
    offer_amount: float | None = None
    equity_pct: float | None = None
    context: dict[str, Any] = Field(default_factory=dict)
    force_refresh: bool = False


class SimulationRequest(BaseModel):
    current_revenue: float = 0
    current_customers: int = 0
    growth_rate: float = 0.2
    cac: float = 0
    churn: float = 0.05
    pricing: float = 0
    marketing_spend: float = 0
    operating_expenses: float = 0
    funding: float = 0
    months: int = 12
    valuation_multiple: float = 8.0

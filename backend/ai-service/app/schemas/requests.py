from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


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


class HiringPlan(BaseModel):
    role: str
    monthly_salary: float = Field(ge=0)
    hiring_month: int = Field(ge=1)
    headcount: int = Field(default=1, ge=1)


class FundingRound(BaseModel):
    investment_amount: float = Field(gt=0)
    # Internally equity is always a decimal, e.g. 0.10 means 10%.
    equity_percentage: float = Field(gt=0, lt=1)
    investment_month: int = Field(default=1, ge=1)


class VerifiedMetric(BaseModel):
    claimed_value: float | None = None
    verified_value: float | None = None
    source: str | None = None
    verification_status: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    last_verified_at: str | None = None


class SimulationRequest(BaseModel):
    """Deterministic simulation input.

    The original compact fields remain supported. Rich fields are optional so
    existing workflow callers can migrate without a breaking API change.
    """
    company_name: str = "Untitled Startup"
    industry: str | None = None
    business_model: str | None = None
    stage: str | None = None
    current_revenue: float = 0
    current_mrr: float | None = Field(default=None, ge=0)
    current_arr: float | None = Field(default=None, ge=0)
    current_customers: int = Field(default=0, ge=0)
    starting_cash: float | None = Field(default=None, ge=0)
    starting_arpu: float | None = Field(default=None, ge=0)
    starting_cac: float | None = Field(default=None, ge=0)
    starting_churn_rate: float | None = Field(default=None, ge=0, lt=1)
    starting_gross_margin: float = Field(default=0.70, ge=0, le=1)
    growth_rate: float = Field(default=0.2, ge=-0.99)
    monthly_revenue_growth: float | None = Field(default=None, ge=-0.99)
    monthly_customer_growth: float | None = Field(default=None, ge=-0.99)
    growth_decay_rate: float = Field(default=0.0, ge=0, lt=1)
    cac: float = Field(default=0, ge=0)
    cac_change_rate: float = 0.0
    churn: float = Field(default=0.05, ge=0, lt=1)
    pricing: float = Field(default=0, ge=0)
    arpu_growth_rate: float = 0.0
    new_customers_per_month: float | None = Field(default=None, ge=0)
    marketing_spend: float = Field(default=0, ge=0)
    sales_budget: float = Field(default=0, ge=0)
    operating_expenses: float = Field(default=0, ge=0)
    fixed_monthly_costs: float | None = Field(default=None, ge=0)
    variable_cost_per_customer: float = Field(default=0, ge=0)
    payroll_cost: float = Field(default=0, ge=0)
    technology_cost: float = Field(default=0, ge=0)
    administrative_cost: float = Field(default=0, ge=0)
    other_costs: float = Field(default=0, ge=0)
    hiring_plan: list[HiringPlan] = Field(default_factory=list)
    funding: float = Field(default=0, ge=0)
    funding_round: FundingRound | None = None
    months: int = Field(default=12, ge=1, le=60)
    forecast_months: int | None = Field(default=None, ge=1, le=60)
    starting_month: date | None = None
    valuation_multiple: float = Field(default=8.0, ge=0)
    max_lifetime_months: int = Field(default=120, ge=1)
    # Optional monthly historical observations. Growth/churn/margin values are
    # decimals; sufficient history (3+ observations) drives mean ± std cases.
    historical_growth_rates: list[float] = Field(default_factory=list)
    historical_cac: list[float] = Field(default_factory=list)
    historical_churn_rates: list[float] = Field(default_factory=list)
    historical_arpu: list[float] = Field(default_factory=list)
    historical_gross_margins: list[float] = Field(default_factory=list)
    simulation_case: Literal["claimed", "verified"] = "claimed"
    verification_metrics: dict[str, VerifiedMetric] = Field(default_factory=dict)
    authoritative_mrr_basis: Literal["customers_arpu", "reported_mrr"] = "reported_mrr"

    @model_validator(mode="after")
    def normalize_legacy_fields(self) -> "SimulationRequest":
        if self.forecast_months is not None:
            self.months = self.forecast_months
        if self.current_mrr is not None:
            self.current_revenue = self.current_mrr
        elif self.current_arr is not None and self.current_revenue == 0:
            self.current_revenue = self.current_arr / 12
        if self.starting_cash is not None:
            self.funding = self.starting_cash
        if self.starting_arpu is not None:
            self.pricing = self.starting_arpu
        if self.starting_cac is not None:
            self.cac = self.starting_cac
        if self.starting_churn_rate is not None:
            self.churn = self.starting_churn_rate

        # Customers × ARPU drives scenario revenue (Bull/Base/Bear scale with logos).
        # Keep current_mrr as the user-entered figure for inconsistency warnings only.
        if self.authoritative_mrr_basis == "customers_arpu" and self.current_customers > 0 and self.pricing > 0:
            self.current_revenue = float(self.current_customers * self.pricing)
        elif self.current_customers > 0 and self.current_revenue > 0 and self.pricing == 0:
            self.pricing = float(self.current_revenue / self.current_customers)
        elif self.pricing > 0 and self.current_revenue > 0 and self.current_customers == 0:
            self.current_customers = int(round(self.current_revenue / self.pricing))

        return self

    def check_month0_consistency(self, tolerance_pct: float = 5.0) -> dict[str, Any]:
        reported_mrr = float(self.current_mrr if self.current_mrr is not None else self.current_revenue)
        customers = float(self.current_customers)
        arpu = float(self.pricing)
        implied_mrr = customers * arpu

        if implied_mrr > 0 and reported_mrr > 0:
            diff_pct = abs(reported_mrr - implied_mrr) / implied_mrr * 100.0
            is_consistent = diff_pct <= tolerance_pct
        else:
            diff_pct = 0.0
            is_consistent = True

        return {
            "is_consistent": is_consistent,
            "reported_mrr": round(reported_mrr, 2),
            "implied_mrr": round(implied_mrr, 2),
            "customers": int(round(customers)),
            "arpu": round(arpu, 2),
            "discrepancy_pct": round(diff_pct, 2),
            "severity": "CRITICAL" if not is_consistent else "OK",
            "message": (
                f"CRITICAL INPUT INCONSISTENCY: Reported Starting MRR (₹{reported_mrr:,.0f}) does not match Customers ({customers:,.0f}) × ARPU (₹{arpu:,.0f}) = ₹{implied_mrr:,.0f} (Discrepancy: {diff_pct:.1f}%)."
                if not is_consistent else "Starting inputs are mathematically consistent."
            ),
        }

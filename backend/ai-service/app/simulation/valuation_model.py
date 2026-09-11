"""Simple valuation helpers — deterministic."""

from __future__ import annotations


def revenue_multiple_valuation(annualized_revenue: float, multiple: float) -> float:
    return round(max(0.0, annualized_revenue * multiple), 2)


def implied_valuation(investment_amount: float, equity_pct: float) -> float | None:
    if equity_pct <= 0 or equity_pct >= 100:
        return None
    return round(investment_amount / (equity_pct / 100.0), 2)

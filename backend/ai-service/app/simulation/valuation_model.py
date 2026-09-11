"""Simple valuation helpers — deterministic."""

from __future__ import annotations

from typing import Any


def revenue_multiple_valuation(annualized_revenue: float, multiple: float) -> float:
    return round(max(0.0, annualized_revenue * multiple), 2)


def implied_valuation(investment_amount: float, equity_pct: float) -> float | None:
    if equity_pct <= 0 or equity_pct >= 100:
        return None
    return round(investment_amount / (equity_pct / 100.0), 2)


def funding_valuation(round_terms: Any) -> dict[str, float]:
    """Return deterministic pre/post-money values; equity is a decimal internally."""
    post_money = round(round_terms.investment_amount / round_terms.equity_percentage, 2)
    pre_money = round(post_money - round_terms.investment_amount, 2)
    return {
        "investment_amount": round(round_terms.investment_amount, 2),
        "equity_percentage": round(round_terms.equity_percentage, 6),
        "post_money": post_money,
        "pre_money": pre_money,
        "investor_ownership": round(round_terms.equity_percentage * 100, 4),
        "founder_ownership": round((1 - round_terms.equity_percentage) * 100, 4),
    }

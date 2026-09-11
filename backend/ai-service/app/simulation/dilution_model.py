"""Equity dilution — deterministic."""

from __future__ import annotations


def post_money_ownership(investment: float, pre_money: float) -> dict[str, float]:
    post = pre_money + investment
    if post <= 0:
        return {"pre_money": pre_money, "post_money": 0.0, "investor_pct": 0.0, "founder_pct": 100.0}
    investor_pct = (investment / post) * 100
    return {
        "pre_money": round(pre_money, 2),
        "post_money": round(post, 2),
        "investor_pct": round(investor_pct, 4),
        "founder_pct": round(100 - investor_pct, 4),
    }

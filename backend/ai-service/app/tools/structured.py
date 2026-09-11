"""Tool stubs for future ADK tool registration (search, retrieval, etc.)."""

from __future__ import annotations

from typing import Any


def matching_score(startup_industries: list[str], investor_industries: list[str]) -> float:
    """Deterministic overlap score — no LLM."""
    if not startup_industries or not investor_industries:
        return 0.0
    a = {x.lower() for x in startup_industries}
    b = {x.lower() for x in investor_industries}
    inter = len(a & b)
    union = len(a | b)
    return round((inter / union) * 100, 2) if union else 0.0


def echo_structured_metrics(metrics: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "market_size",
        "growth_rate",
        "cac",
        "churn",
        "customers",
        "revenue",
        "marketing_budget",
        "operating_cost",
        "runway",
        "valuation",
    }
    return {k: metrics.get(k) for k in allowed if metrics.get(k) is not None}

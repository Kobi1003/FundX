"""Cost / burn model — deterministic."""

from __future__ import annotations


def monthly_burn(operating_expenses: float, marketing_spend: float, revenue: float) -> float:
    return max(0.0, operating_expenses + marketing_spend - revenue)


def project_burn(
    operating_expenses: float,
    marketing_spend: float,
    revenue_series: list[float],
) -> list[float]:
    return [round(monthly_burn(operating_expenses, marketing_spend, r), 2) for r in revenue_series]

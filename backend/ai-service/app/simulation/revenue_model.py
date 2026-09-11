"""Revenue projections — deterministic."""

from __future__ import annotations


def project_revenue(
    current_revenue: float,
    growth_rate: float,
    months: int,
) -> list[float]:
    series: list[float] = []
    revenue = float(current_revenue)
    monthly_growth = (1 + growth_rate) ** (1 / 12) - 1
    for _ in range(months):
        revenue *= 1 + monthly_growth
        series.append(round(revenue, 2))
    return series

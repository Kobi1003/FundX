"""Revenue projections — deterministic customers * ARPU."""

from __future__ import annotations


def project_revenue(
    customer_series: list[int | float],
    arpu: float,
    arpu_growth_rate: float = 0.0,
) -> list[float]:
    series: list[float] = []
    current_arpu = float(arpu)
    for cust in customer_series:
        current_arpu *= 1 + arpu_growth_rate
        series.append(round(float(cust) * current_arpu, 2))
    return series

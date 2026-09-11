"""Customer growth with churn — deterministic."""

from __future__ import annotations


def project_customers(
    current_customers: int,
    marketing_spend: float,
    cac: float,
    churn: float,
    months: int,
) -> list[int]:
    customers = float(current_customers)
    series: list[int] = []
    new_per_month = (marketing_spend / cac) if cac > 0 else 0.0
    for _ in range(months):
        customers = customers * (1 - churn) + new_per_month
        series.append(max(0, int(round(customers))))
    return series

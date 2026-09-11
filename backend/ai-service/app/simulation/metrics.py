"""Safe unit-economics calculations used by the deterministic engine."""
from __future__ import annotations


def ltv(arpu: float, gross_margin: float, monthly_churn: float, max_lifetime_months: int) -> float:
    """Gross-margin adjusted LTV, capped for zero or near-zero churn."""
    lifetime = min(1 / monthly_churn, max_lifetime_months) if monthly_churn > 0 else max_lifetime_months
    return round(max(0.0, arpu * gross_margin * lifetime), 2)


def ratio(numerator: float, denominator: float) -> float | None:
    return round(numerator / denominator, 2) if denominator > 0 else None


def ltv_cac_health(value: float | None) -> str:
    if value is None:
        return "not meaningful"
    if value >= 3:
        return "healthy"
    if value >= 1:
        return "borderline"
    return "concerning"


def burn_multiple(net_burn: float, net_new_arr: float) -> float | None:
    return ratio(net_burn, net_new_arr) if net_burn > 0 and net_new_arr > 0 else None

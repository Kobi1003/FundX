"""Runway calculation — deterministic."""

from __future__ import annotations


def runway_months(cash: float, burn_series: list[float]) -> float:
    if cash <= 0:
        return 0.0
    remaining = cash
    months = 0.0
    for burn in burn_series:
        if burn <= 0:
            months += 1
            continue
        if remaining < burn:
            months += remaining / burn
            return round(months, 2)
        remaining -= burn
        months += 1
    if burn_series and burn_series[-1] > 0 and remaining > 0:
        months += remaining / burn_series[-1]
    return round(months, 2)

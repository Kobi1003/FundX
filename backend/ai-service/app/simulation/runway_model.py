"""Runway calculation — deterministic."""

from __future__ import annotations


def calculate_runway_from_cash_series(starting_cash: float, cash_series: list[float]) -> tuple[int | None, str]:
    """Finds the first month where cash <= 0."""
    for month_idx, cash in enumerate(cash_series, start=1):
        if cash <= 0:
            return month_idx, f"cash-out in month {month_idx}"
    
    if len(cash_series) >= 2 and cash_series[-1] > cash_series[0]:
        return None, "cash-flow positive / runway not constrained"
    
    return None, f"not constrained within forecast horizon ({len(cash_series)}+ months)"

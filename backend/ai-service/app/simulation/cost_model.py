"""Cost / burn model — deterministic."""

from __future__ import annotations


def monthly_opex(fixed_costs: float, marketing_spend: float, additional_costs: float = 0.0) -> float:
    return fixed_costs + marketing_spend + additional_costs


def monthly_operating_profit(gross_profit: float, opex: float) -> float:
    return gross_profit - opex


def monthly_burn(operating_profit: float) -> float:
    return max(0.0, -operating_profit)

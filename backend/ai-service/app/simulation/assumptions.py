"""Simulation assumptions — configurable, deterministic operating drivers."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScenarioAssumptions:
    name: str
    growth_multiplier: float
    churn_multiplier: float
    cac_multiplier: float
    fixed_costs_multiplier: float
    arpu_multiplier: float
    gross_margin_delta: float
    marketing_multiplier: float = 1.0
    opex_multiplier: float = 1.0  # Backward-compatibility alias


# Default scenario multipliers:
# Bull: Growth +25%, CAC -15%, Churn -20%, ARPU +10%, Margin +5pp, Fixed Costs +5%
# Base: Verified / current operating assumptions (1.0x)
# Bear: Growth -25%, CAC +20%, Churn +30%, ARPU -10%, Margin -5pp, Fixed Costs +10%
BULL = ScenarioAssumptions(
    name="bull",
    growth_multiplier=1.25,
    churn_multiplier=0.80,
    cac_multiplier=0.85,
    fixed_costs_multiplier=1.05,
    arpu_multiplier=1.10,
    gross_margin_delta=0.05,
    marketing_multiplier=1.0,
    opex_multiplier=1.05,
)

BASE = ScenarioAssumptions(
    name="base",
    growth_multiplier=1.00,
    churn_multiplier=1.00,
    cac_multiplier=1.00,
    fixed_costs_multiplier=1.00,
    arpu_multiplier=1.00,
    gross_margin_delta=0.00,
    marketing_multiplier=1.0,
    opex_multiplier=1.00,
)

BEAR = ScenarioAssumptions(
    name="bear",
    growth_multiplier=0.75,
    churn_multiplier=1.30,
    cac_multiplier=1.20,
    fixed_costs_multiplier=1.10,
    arpu_multiplier=0.90,
    gross_margin_delta=-0.05,
    marketing_multiplier=1.0,
    opex_multiplier=1.10,
)

ALL_SCENARIOS = (BULL, BASE, BEAR)


def get_scenario_config(name: str) -> ScenarioAssumptions:
    for s in ALL_SCENARIOS:
        if s.name == name.lower():
            return s
    return BASE

"""Simulation assumptions — pure Python, no LLM."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScenarioAssumptions:
    name: str
    growth_multiplier: float
    churn_multiplier: float
    cac_multiplier: float
    opex_multiplier: float


BULL = ScenarioAssumptions("bull", 1.35, 0.75, 0.85, 0.95)
BASE = ScenarioAssumptions("base", 1.0, 1.0, 1.0, 1.0)
BEAR = ScenarioAssumptions("bear", 0.65, 1.35, 1.25, 1.1)

ALL_SCENARIOS = (BULL, BASE, BEAR)

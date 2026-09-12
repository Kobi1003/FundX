"""Input validation helpers kept separate from calculation code."""
from __future__ import annotations

from app.schemas.requests import SimulationRequest


def validate_request(request: SimulationRequest) -> None:
    if request.funding_round and request.funding_round.investment_month > request.months:
        raise ValueError("funding_round.investment_month must be within forecast months")
    if any(plan.hiring_month > request.months for plan in request.hiring_plan):
        raise ValueError("hiring_plan.hiring_month must be within forecast months")

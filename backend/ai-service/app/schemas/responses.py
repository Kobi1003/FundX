from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AgentStepResult(BaseModel):
    agent: str
    summary: str
    structured: dict[str, Any] = Field(default_factory=dict)
    tokens_used: int = 0
    from_cache: bool = False


class WorkflowResult(BaseModel):
    workflow: str
    status: str
    provider: str
    demo_mode: bool
    ai_calls: int
    max_ai_calls: int
    input_hash: str
    from_cache: bool = False
    steps: list[AgentStepResult] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    simulation: dict[str, Any] | None = None
    report: str | None = None

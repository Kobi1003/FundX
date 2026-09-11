from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class UsageTracker:
    """Tracks AI calls within a single workflow run. Hard ceiling enforced."""

    max_calls: int
    calls: int = 0
    by_agent: dict[str, int] = field(default_factory=dict)

    def can_call(self) -> bool:
        return self.calls < self.max_calls

    def record(self, agent: str) -> None:
        if not self.can_call():
            raise RuntimeError(f"AI call budget exhausted (max={self.max_calls})")
        self.calls += 1
        self.by_agent[agent] = self.by_agent.get(agent, 0) + 1

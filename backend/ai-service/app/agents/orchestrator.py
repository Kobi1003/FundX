"""
Google ADK integration point.

Do NOT fake ADK APIs. Import and wrap real google.adk types when implementing
full agent graphs. Until then, workflows call providers through AgentRunner
with a hard call budget.
"""

from __future__ import annotations

from typing import Any

from shared.config import get_settings

from app.providers.factory import get_fallback_provider, get_provider
from app.usage.tracker import UsageTracker


class ADKIntegrationPoint:
    """
    Placeholder for real Google ADK Agent / Runner wiring.

    Example (when implementing):
        from google.adk.agents import Agent
        from google.adk.runners import Runner
        ...
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self._adk_available = self._detect_adk()

    @staticmethod
    def _detect_adk() -> bool:
        try:
            import google.adk  # noqa: F401

            return True
        except ImportError:
            return False

    @property
    def available(self) -> bool:
        return self._adk_available

    def build_runner_notes(self) -> dict[str, Any]:
        return {
            "adk_installed": self._adk_available,
            "note": "Wire google.adk Agent/Runner here for production agent graphs.",
        }


class AgentRunner:
    """Bounded sequential agent execution — no recursive fan-out."""

    def __init__(self, max_calls: int | None = None) -> None:
        settings = get_settings()
        self.settings = settings
        self.tracker = UsageTracker(max_calls=max_calls or settings.max_ai_calls_per_workflow)
        self.provider = get_provider(settings)
        self.fallback = get_fallback_provider(settings)
        self.adk = ADKIntegrationPoint()

    async def call_agent(self, agent_name: str, prompt: str, *, system: str | None = None) -> dict[str, Any]:
        self.tracker.record(agent_name)
        text, used = await self.provider.generate_with_fallback(
            prompt,
            system=system,
            fallback=self.fallback,
            max_retries=self.settings.max_ai_retries,
            agent=agent_name,
        )
        return {
            "agent": agent_name,
            "summary": text,
            "provider": used,
            "tokens_used": 0,
            "from_cache": False,
        }

"""
Google ADK integration + bounded AgentRunner.

When google-adk is installed and DEMO_MODE=false, workflows may build a
SequentialAgent graph. Until then (and on any failure), AgentRunner executes
agents via the provider abstraction with a hard call budget.
"""

from __future__ import annotations

from typing import Any

from shared.config import get_settings

from app.providers.factory import get_fallback_provider, get_provider
from app.usage.tracker import UsageTracker


class ADKIntegrationPoint:
    """Detects and optionally builds a Google ADK SequentialAgent pipeline."""

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

    def build_startup_sequential_agent(self) -> Any | None:
        """
        Build ADK SequentialAgent for startup analysis when packages are present.

        Returns None if ADK / genai are unavailable — callers must fall back.
        """
        if not self._adk_available or self.settings.demo_mode:
            return None
        try:
            from google.adk.agents import LlmAgent, SequentialAgent
        except Exception:
            try:
                from google.adk.agents import Agent as LlmAgent  # type: ignore
                from google.adk.agents import SequentialAgent  # type: ignore
            except Exception:
                return None

        model = "gemini-2.0-flash"
        api_key = self.settings.gemini_api_key
        if not api_key:
            return None

        def _agent(name: str, instruction: str) -> Any:
            try:
                return LlmAgent(name=name, model=model, instruction=instruction)
            except TypeError:
                return LlmAgent(name=name, model=model, instruction=instruction)  # noqa: TRY300

        document = _agent(
            "document_intelligence",
            "Extract claims and evidence status from startup materials. Return concise bullets.",
        )
        market = _agent(
            "market_research",
            "Assess TAM/SAM/SOM claims and market risks. Be concise.",
        )
        competition = _agent(
            "competition",
            "Map competitors and defensibility. Be concise.",
        )
        financial = _agent(
            "financial_extract",
            "Extract numeric assumptions (CAC, churn, growth). Do not compute projections.",
        )
        red_team = _agent(
            "red_team",
            "Challenge the riskiest assumptions with specific diligence questions.",
        )
        synthesizer = _agent(
            "investment_analyst",
            "Synthesize upstream findings into an investment readiness summary.",
        )

        try:
            return SequentialAgent(
                name="startup_analysis_pipeline",
                sub_agents=[document, market, competition, financial, red_team, synthesizer],
            )
        except Exception:
            return None

    def build_runner_notes(self) -> dict[str, Any]:
        return {
            "adk_installed": self._adk_available,
            "demo_mode": self.settings.demo_mode,
            "sequential_agent_ready": self.build_startup_sequential_agent() is not None,
            "note": (
                "Install google-adk + set GEMINI_API_KEY and DEMO_MODE=false to enable ADK graphs. "
                "AgentRunner remains the reliable demo path."
            ),
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
            "adk_available": self.adk.available,
        }

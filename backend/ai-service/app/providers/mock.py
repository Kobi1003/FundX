"""Deterministic mock provider for DEMO_MODE and API outages."""

from __future__ import annotations

from typing import Any

from app.providers.base import BaseAIProvider


class MockProvider(BaseAIProvider):
    name = "mock"

    async def generate(self, prompt: str, *, system: str | None = None, **kwargs: Any) -> str:
        agent = kwargs.get("agent", "generic")
        samples = {
            "document": (
                "Extracted key claims: recurring SaaS revenue, expanding clean-energy TAM, "
                "early pilot customers with expanding contract values."
            ),
            "market": (
                "Market appears attractive with multi-billion TAM and ~30%+ category growth. "
                "Primary risk is longer sales cycles in regulated segments."
            ),
            "competition": (
                "Competitive set includes 3 well-funded peers. Differentiation hinges on "
                "deployment speed and vertical integrations."
            ),
            "financial": (
                "Unit economics look workable if CAC stays under target and churn remains low. "
                "Runway depends on burn vs. next financing."
            ),
            "red_team": (
                "Key risks: customer concentration, policy dependency, and optimistic growth assumptions."
            ),
            "investment_analyst": (
                "Overall thesis is investable at seed with milestone-based tranche structure."
            ),
            "negotiation": (
                "Suggest anchoring on fair dilution, clear use of funds, and investor protective rights "
                "that still leave founders with operating control."
            ),
            "investor": (
                "Investor background suggests thesis-fit with climate and infrastructure software."
            ),
        }
        body = samples.get(agent, f"Mock analysis for prompt hash length={len(prompt)}.")
        prefix = f"[{agent}] " if agent else ""
        return f"{prefix}{body}"

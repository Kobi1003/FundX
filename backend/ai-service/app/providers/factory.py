"""Factory for AI providers based on AI_PROVIDER / DEMO_MODE."""

from __future__ import annotations

from shared.config import Settings, get_settings

from app.providers.base import BaseAIProvider
from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.providers.mock import MockProvider


def get_provider(settings: Settings | None = None) -> BaseAIProvider:
    settings = settings or get_settings()
    if settings.demo_mode or settings.ai_provider == "mock":
        return MockProvider()
    if settings.ai_provider == "gemini":
        return GeminiProvider(settings.gemini_api_key)
    if settings.ai_provider == "groq":
        return GroqProvider(settings.groq_api_key)
    return MockProvider()


def get_fallback_provider(settings: Settings | None = None) -> BaseAIProvider:
    """Always fall back to mock so demos never crash."""
    return MockProvider()

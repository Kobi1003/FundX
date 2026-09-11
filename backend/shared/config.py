"""Shared settings loaded from environment."""

from __future__ import annotations

import os
from functools import lru_cache


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    def __init__(self) -> None:
        self.service_name = os.getenv("SERVICE_NAME", "unknown")
        self.port = int(os.getenv("PORT", "8000"))
        self.demo_mode = _bool(os.getenv("DEMO_MODE"), default=True)
        self.ai_provider = os.getenv("AI_PROVIDER", "mock").lower()

        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "")
        self.supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")

        self.neo4j_uri = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        self.neo4j_user = os.getenv("NEO4J_USER", "neo4j")
        self.neo4j_password = os.getenv("NEO4J_PASSWORD", "fundx_neo4j_password")

        self.user_service_url = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
        self.startup_service_url = os.getenv("STARTUP_SERVICE_URL", "http://startup-service:8002")
        self.investor_service_url = os.getenv("INVESTOR_SERVICE_URL", "http://investor-service:8003")
        self.deal_service_url = os.getenv("DEAL_SERVICE_URL", "http://deal-service:8004")
        self.ai_service_url = os.getenv("AI_SERVICE_URL", "http://ai-service:8005")

        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.max_ai_retries = int(os.getenv("MAX_AI_RETRIES", "2"))
        self.max_ai_calls_per_workflow = int(os.getenv("MAX_AI_CALLS_PER_WORKFLOW", "8"))


@lru_cache
def get_settings() -> Settings:
    return Settings()

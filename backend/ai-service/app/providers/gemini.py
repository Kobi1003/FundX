"""Gemini provider. Uses google-genai when available; fails cleanly otherwise."""

from __future__ import annotations

import os
from typing import Any

from app.providers.base import BaseAIProvider


class GeminiProvider(BaseAIProvider):
    name = "gemini"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")

    async def generate(self, prompt: str, *, system: str | None = None, **kwargs: Any) -> str:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        try:
            import google.generativeai as genai
        except ImportError as exc:
            raise RuntimeError("google-generativeai is not installed") from exc

        genai.configure(api_key=self.api_key)
        model_name = kwargs.get("model", "gemini-2.0-flash")
        model = genai.GenerativeModel(model_name, system_instruction=system)
        # Synchronous SDK call — acceptable for hackathon scaffold
        response = model.generate_content(prompt)
        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini returned empty response")
        return text

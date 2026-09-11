"""Groq provider via OpenAI-compatible HTTP API."""

from __future__ import annotations

import os
from typing import Any

import httpx

from app.providers.base import BaseAIProvider


class GroqProvider(BaseAIProvider):
    name = "groq"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate(self, prompt: str, *, system: str | None = None, **kwargs: Any) -> str:
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY is not configured")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": kwargs.get("model", "llama-3.3-70b-versatile"),
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.2),
        }
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(self.base_url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError(f"Unexpected Groq response: {data}") from exc

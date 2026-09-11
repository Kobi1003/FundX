"""AI provider abstraction — never hard-code API keys."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseAIProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def generate(self, prompt: str, *, system: str | None = None, **kwargs: Any) -> str:
        raise NotImplementedError

    async def generate_with_fallback(
        self,
        prompt: str,
        *,
        system: str | None = None,
        fallback: "BaseAIProvider | None" = None,
        max_retries: int = 2,
        **kwargs: Any,
    ) -> tuple[str, str]:
        """
        Limited retries on primary, then optional fallback provider.
        Returns (text, provider_name_used).
        """
        last_error: Exception | None = None
        for _ in range(max(1, max_retries)):
            try:
                text = await self.generate(prompt, system=system, **kwargs)
                return text, self.name
            except Exception as exc:  # noqa: BLE001
                last_error = exc

        if fallback is not None:
            text = await fallback.generate(prompt, system=system, **kwargs)
            return text, fallback.name

        raise RuntimeError(f"AI provider failed after retries: {last_error}")

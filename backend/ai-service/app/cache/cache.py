"""In-memory analysis cache. Swap for Supabase startup_analysis_runs later."""

from __future__ import annotations

from typing import Any

_CACHE: dict[str, dict[str, Any]] = {}


def get_cached(key: str) -> dict[str, Any] | None:
    return _CACHE.get(key)


def set_cached(key: str, value: dict[str, Any]) -> None:
    _CACHE[key] = value


def clear_cache() -> None:
    _CACHE.clear()

"""Supabase client helpers. Service role key must never reach the frontend."""

from __future__ import annotations

from typing import Any

from shared.config import Settings, get_settings


def get_supabase_client(settings: Settings | None = None, *, use_service_role: bool = False) -> Any:
    """
    Return a supabase-py client when credentials are configured.

    Returns None if URL/key are missing so services can still boot in demo mode.
    """
    settings = settings or get_settings()
    key = settings.supabase_service_role_key if use_service_role else settings.supabase_anon_key
    if not settings.supabase_url or not key:
        return None

    try:
        from supabase import create_client
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("supabase package is not installed") from exc

    return create_client(settings.supabase_url, key)


def supabase_configured(settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    return bool(settings.supabase_url and (settings.supabase_anon_key or settings.supabase_service_role_key))

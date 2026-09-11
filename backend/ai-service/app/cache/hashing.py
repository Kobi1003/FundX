"""Normalize payload and produce a stable hash for cache keys."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def normalize_input(payload: dict[str, Any]) -> dict[str, Any]:
    """Drop volatile flags and sort keys for stable hashing."""
    data = {k: v for k, v in payload.items() if k not in {"force_refresh"}}
    return json.loads(json.dumps(data, sort_keys=True, default=str))


def hash_input(payload: dict[str, Any]) -> str:
    normalized = normalize_input(payload)
    raw = json.dumps(normalized, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

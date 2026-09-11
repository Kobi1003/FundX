"""
Database connection pool and async query helpers for PostgreSQL.
Provides automatic retry, schema initialization, and dict serialization.
"""

from __future__ import annotations

import decimal
import json
import logging
import os
from typing import Any

logger = logging.getLogger("fundx.db")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://fundx_user:fundx_password@postgres:5432/fundx_db",
)

_POOL = None


def _format_row(d: dict[str, Any]) -> dict[str, Any]:
    out = {}
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        elif isinstance(v, decimal.Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out


async def get_pool():
    global _POOL
    if _POOL is not None and not _POOL._closed:
        return _POOL

    try:
        import asyncpg

        async def init_connection(conn):
            await conn.set_type_codec(
                "jsonb",
                encoder=json.dumps,
                decoder=json.loads,
                schema="pg_catalog",
            )
            await conn.set_type_codec(
                "json",
                encoder=json.dumps,
                decoder=json.loads,
                schema="pg_catalog",
            )

        _POOL = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=2,
            max_size=10,
            init=init_connection,
            timeout=10,
        )
        logger.info("Connected to PostgreSQL database.")
        return _POOL
    except Exception as exc:
        logger.warning(f"Could not connect to PostgreSQL ({exc}). Operating in resilient mode.")
        return None


async def execute(query: str, *args) -> str | None:
    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                return await conn.execute(query, *args)
        except Exception as exc:
            logger.error(f"execute query failed: {exc} for {query}")
            return None
    return None


async def fetch(query: str, *args) -> list[dict[str, Any]]:
    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                records = await conn.fetch(query, *args)
                return [_format_row(dict(r)) for r in records]
        except Exception as exc:
            logger.error(f"fetch query failed: {exc} for {query}")
            return []
    return []


async def fetchrow(query: str, *args) -> dict[str, Any] | None:
    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(query, *args)
                return _format_row(dict(record)) if record else None
        except Exception as exc:
            logger.error(f"fetchrow query failed: {exc} for {query}")
            return None
    return None


async def fetchval(query: str, *args) -> Any:
    pool = await get_pool()
    if pool:
        try:
            async with pool.acquire() as conn:
                return await conn.fetchval(query, *args)
        except Exception as exc:
            logger.error(f"fetchval query failed: {exc} for {query}")
            return None
    return None


def serialize_json(obj: Any) -> str:
    """Helper to dump objects into JSON string if needed."""
    if obj is None:
        return "{}"
    if isinstance(obj, (dict, list)):
        return json.dumps(obj)
    return str(obj)

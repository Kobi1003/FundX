"""Neo4j connectivity for relationship-oriented data only."""

from __future__ import annotations

from typing import Any

from shared.config import Settings, get_settings

_driver = None


def get_driver(settings: Settings | None = None):
    global _driver
    settings = settings or get_settings()
    if _driver is None:
        from neo4j import GraphDatabase

        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


def close_driver() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


def health_check(settings: Settings | None = None) -> dict[str, Any]:
    """Return Neo4j health status without raising on connection failure."""
    settings = settings or get_settings()
    try:
        driver = get_driver(settings)
        with driver.session() as session:
            result = session.run("RETURN 1 AS ok")
            record = result.single()
            ok = bool(record and record.get("ok") == 1)
        return {"status": "ok" if ok else "degraded", "neo4j": settings.neo4j_uri}
    except Exception as exc:  # noqa: BLE001 — health must never crash the service
        return {"status": "unavailable", "neo4j": settings.neo4j_uri, "error": str(exc)}


# Seed relationship patterns (IDs should match Postgres/Supabase IDs):
# (:User)-[:OWNS]->(:Startup|:Investor)
# (:Startup)-[:OPERATES_IN]->(:Industry)
# (:Startup)-[:LISTED]->(:Deal)
# (:Investor)-[:INTERESTED_IN]->(:Industry|:Startup|:Deal)
# (:Investor)-[:MADE_OFFER]->(:Offer)-[:ON_DEAL]->(:Deal)
# (:Investor)-[:NEGOTIATED]->(:Deal)
# See shared/neo4j/graph_sync.py for live writers and scripts/sync_neo4j_from_postgres.py for backfill.

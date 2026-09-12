#!/usr/bin/env python3
"""Populate Neo4j from Postgres demo/runtime data (+ optional Cypher seed).

Usage (from repo root, with Docker services up):
  python scripts/sync_neo4j_from_postgres.py
  python scripts/sync_neo4j_from_postgres.py --cypher-seed
  docker compose exec user-service python -c "..."  # or run via host with localhost ports
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "backend"))


async def fetch_snapshot():
    from shared import db

    await db.get_pool()
    profiles = await db.fetch("SELECT id, email, full_name, role, startup_id, investor_id FROM public.profiles")
    startups = await db.fetch("SELECT id, name, stage, industry, email FROM public.startups")
    investors = await db.fetch("SELECT id, display_name, firm, email FROM public.investors")
    preferences = await db.fetch("SELECT investor_id, industries FROM public.investment_preferences")
    deals = await db.fetch(
        "SELECT id, startup_id, title, status, industry, funding_stage, target_raise FROM public.deals"
    )
    interests = await db.fetch(
        "SELECT deal_id, investor_id, investor_name, status FROM public.deal_interests"
    )
    offers = await db.fetch(
        """
        SELECT id, deal_id, investor_id, investor_name, sender_type, amount, equity_pct, royalty_pct, status
        FROM public.offers
        """
    )
    return {
        "profiles": profiles or [],
        "startups": startups or [],
        "investors": investors or [],
        "preferences": preferences or [],
        "deals": deals or [],
        "interests": interests or [],
        "offers": offers or [],
    }


def run_cypher_seed(uri: str, user: str, password: str) -> None:
    from neo4j import GraphDatabase

    cypher_file = os.path.join(ROOT, "database", "neo4j", "seed", "seed.cypher")
    with open(cypher_file, encoding="utf-8") as f:
        raw = f.read()
    # Split on semicolons but keep multi-line MERGE blocks intact
    statements = [s.strip() for s in raw.split(";") if s.strip() and not s.strip().startswith("//")]
    driver = GraphDatabase.driver(uri, auth=(user, password))
    with driver.session() as session:
        for stmt in statements:
            # Drop leading comment-only lines inside the chunk
            lines = [ln for ln in stmt.splitlines() if not ln.strip().startswith("//")]
            body = "\n".join(lines).strip()
            if body:
                session.run(body)
    driver.close()
    print(f"[OK] Cypher seed applied from {cypher_file}")


async def main() -> int:
    parser = argparse.ArgumentParser(description="Sync FundX Postgres demo data into Neo4j")
    parser.add_argument("--cypher-seed", action="store_true", help="Also run database/neo4j/seed/seed.cypher first")
    parser.add_argument("--neo4j-uri", default=os.getenv("NEO4J_URI", "bolt://localhost:7687"))
    parser.add_argument("--neo4j-user", default=os.getenv("NEO4J_USER", "neo4j"))
    parser.add_argument("--neo4j-password", default=os.getenv("NEO4J_PASSWORD", "fundx_neo4j_password"))
    args = parser.parse_args()

    os.environ.setdefault("NEO4J_URI", args.neo4j_uri)
    os.environ.setdefault("NEO4J_USER", args.neo4j_user)
    os.environ.setdefault("NEO4J_PASSWORD", args.neo4j_password)
    # Host-side Postgres port from docker-compose
    os.environ.setdefault(
        "DATABASE_URL",
        os.getenv("DATABASE_URL", "postgresql://fundx_user:fundx_password@localhost:5432/fundx_db"),
    )

    if args.cypher_seed:
        try:
            run_cypher_seed(args.neo4j_uri, args.neo4j_user, args.neo4j_password)
        except Exception as exc:
            print(f"[WARN] Cypher seed failed: {exc}")

    from shared.neo4j.graph_sync import sync_postgres_snapshot

    snapshot = await fetch_snapshot()
    counts = sync_postgres_snapshot(**snapshot)
    print("[OK] Neo4j synced from Postgres:", counts)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

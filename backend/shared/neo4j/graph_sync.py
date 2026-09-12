"""Neo4j graph writes for FundX relationship data.

Postgres remains the system of record. These helpers mirror relationship-oriented
events into Neo4j and never raise into request handlers.
"""

from __future__ import annotations

import logging
from typing import Any, Iterable

from shared.neo4j_client import get_driver

logger = logging.getLogger("fundx.neo4j.graph_sync")


def _run(cypher: str, **params: Any) -> bool:
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run(cypher, **params)
        return True
    except Exception as exc:  # noqa: BLE001 — graph sync must not break product APIs
        logger.warning("Neo4j write failed: %s | cypher=%s params=%s", exc, cypher.split("\n")[0][:80], params)
        return False


def upsert_startup(
    startup_id: str,
    *,
    name: str | None = None,
    stage: str | None = None,
    industry: str | None = None,
    email: str | None = None,
) -> bool:
    ok = _run(
        """
        MERGE (s:Startup {id: $id})
        SET s.name = coalesce($name, s.name),
            s.stage = coalesce($stage, s.stage),
            s.email = coalesce($email, s.email),
            s.updated_at = datetime()
        """,
        id=str(startup_id),
        name=name,
        stage=stage,
        email=email,
    )
    if industry:
        ok = link_startup_industry(startup_id, industry) and ok
    return ok


def upsert_investor(
    investor_id: str,
    *,
    name: str | None = None,
    firm: str | None = None,
    email: str | None = None,
) -> bool:
    return _run(
        """
        MERGE (i:Investor {id: $id})
        SET i.name = coalesce($name, i.name),
            i.firm = coalesce($firm, i.firm),
            i.email = coalesce($email, i.email),
            i.updated_at = datetime()
        """,
        id=str(investor_id),
        name=name,
        firm=firm,
        email=email,
    )


def upsert_user(
    user_id: str,
    *,
    email: str | None = None,
    full_name: str | None = None,
    role: str | None = None,
) -> bool:
    return _run(
        """
        MERGE (u:User {id: $id})
        SET u.email = coalesce($email, u.email),
            u.full_name = coalesce($full_name, u.full_name),
            u.role = coalesce($role, u.role),
            u.updated_at = datetime()
        """,
        id=str(user_id),
        email=email,
        full_name=full_name,
        role=role,
    )


def link_user_startup(user_id: str, startup_id: str) -> bool:
    return _run(
        """
        MERGE (u:User {id: $user_id})
        MERGE (s:Startup {id: $startup_id})
        MERGE (u)-[:OWNS]->(s)
        """,
        user_id=str(user_id),
        startup_id=str(startup_id),
    )


def link_user_investor(user_id: str, investor_id: str) -> bool:
    return _run(
        """
        MERGE (u:User {id: $user_id})
        MERGE (i:Investor {id: $investor_id})
        MERGE (u)-[:OWNS]->(i)
        """,
        user_id=str(user_id),
        investor_id=str(investor_id),
    )


def link_startup_industry(startup_id: str, industry: str) -> bool:
    industry = (industry or "").strip()
    if not industry:
        return True
    return _run(
        """
        MERGE (s:Startup {id: $startup_id})
        MERGE (ind:Industry {name: $industry})
        MERGE (s)-[:OPERATES_IN]->(ind)
        """,
        startup_id=str(startup_id),
        industry=industry,
    )


def set_investor_industries(investor_id: str, industries: Iterable[str]) -> bool:
    names = [str(x).strip() for x in (industries or []) if str(x).strip()]
    ok = upsert_investor(investor_id)
    # Drop previous industry interest edges, then recreate from preferences.
    ok = _run(
        """
        MATCH (i:Investor {id: $investor_id})-[r:INTERESTED_IN]->(:Industry)
        DELETE r
        """,
        investor_id=str(investor_id),
    ) and ok
    for name in names:
        ok = _run(
            """
            MERGE (i:Investor {id: $investor_id})
            MERGE (ind:Industry {name: $industry})
            MERGE (i)-[:INTERESTED_IN]->(ind)
            """,
            investor_id=str(investor_id),
            industry=name,
        ) and ok
    return ok


def upsert_deal(
    deal_id: str,
    *,
    startup_id: str | None = None,
    title: str | None = None,
    status: str | None = None,
    industry: str | None = None,
    funding_stage: str | None = None,
    target_raise: float | None = None,
) -> bool:
    ok = _run(
        """
        MERGE (d:Deal {id: $id})
        SET d.title = coalesce($title, d.title),
            d.status = coalesce($status, d.status),
            d.industry = coalesce($industry, d.industry),
            d.funding_stage = coalesce($funding_stage, d.funding_stage),
            d.target_raise = coalesce($target_raise, d.target_raise),
            d.updated_at = datetime()
        """,
        id=str(deal_id),
        title=title,
        status=status,
        industry=industry,
        funding_stage=funding_stage,
        target_raise=target_raise,
    )
    if startup_id:
        ok = _run(
            """
            MERGE (d:Deal {id: $deal_id})
            MERGE (s:Startup {id: $startup_id})
            MERGE (s)-[:LISTED]->(d)
            """,
            deal_id=str(deal_id),
            startup_id=str(startup_id),
        ) and ok
        if industry:
            ok = link_startup_industry(startup_id, industry) and ok
    return ok


def express_interest(
    investor_id: str,
    deal_id: str,
    *,
    startup_id: str | None = None,
    investor_name: str | None = None,
    status: str = "interested",
) -> bool:
    ok = upsert_investor(investor_id, name=investor_name)
    ok = upsert_deal(deal_id) and ok
    ok = _run(
        """
        MERGE (i:Investor {id: $investor_id})
        MERGE (d:Deal {id: $deal_id})
        MERGE (i)-[r:INTERESTED_IN]->(d)
        SET r.status = $status, r.updated_at = datetime()
        """,
        investor_id=str(investor_id),
        deal_id=str(deal_id),
        status=status,
    ) and ok
    if startup_id:
        ok = _run(
            """
            MERGE (i:Investor {id: $investor_id})
            MERGE (s:Startup {id: $startup_id})
            MERGE (i)-[:INTERESTED_IN]->(s)
            """,
            investor_id=str(investor_id),
            startup_id=str(startup_id),
        ) and ok
    return ok


def record_offer(
    offer_id: str,
    deal_id: str,
    *,
    investor_id: str | None = None,
    investor_name: str | None = None,
    sender_type: str | None = None,
    amount: float | None = None,
    equity_pct: float | None = None,
    royalty_pct: float | None = None,
    status: str | None = None,
) -> bool:
    ok = upsert_deal(deal_id)
    ok = _run(
        """
        MERGE (o:Offer {id: $offer_id})
        SET o.sender_type = coalesce($sender_type, o.sender_type),
            o.amount = coalesce($amount, o.amount),
            o.equity_pct = coalesce($equity_pct, o.equity_pct),
            o.royalty_pct = coalesce($royalty_pct, o.royalty_pct),
            o.status = coalesce($status, o.status),
            o.updated_at = datetime()
        WITH o
        MERGE (d:Deal {id: $deal_id})
        MERGE (o)-[:ON_DEAL]->(d)
        """,
        offer_id=str(offer_id),
        deal_id=str(deal_id),
        sender_type=sender_type,
        amount=amount,
        equity_pct=equity_pct,
        royalty_pct=royalty_pct,
        status=status,
    ) and ok
    if investor_id and investor_id != "system":
        ok = upsert_investor(investor_id, name=investor_name) and ok
        ok = _run(
            """
            MERGE (i:Investor {id: $investor_id})
            MERGE (o:Offer {id: $offer_id})
            MERGE (d:Deal {id: $deal_id})
            MERGE (i)-[:MADE_OFFER]->(o)
            MERGE (i)-[r:NEGOTIATED]->(d)
            SET r.last_offer_id = $offer_id, r.updated_at = datetime()
            """,
            investor_id=str(investor_id),
            offer_id=str(offer_id),
            deal_id=str(deal_id),
        ) and ok
    return ok


def sync_postgres_snapshot(
    *,
    startups: list[dict[str, Any]],
    investors: list[dict[str, Any]],
    preferences: list[dict[str, Any]],
    deals: list[dict[str, Any]],
    interests: list[dict[str, Any]],
    offers: list[dict[str, Any]],
    profiles: list[dict[str, Any]] | None = None,
) -> dict[str, int]:
    """Bulk upsert from Postgres rows (demo backfill / recovery)."""
    counts = {"startups": 0, "investors": 0, "deals": 0, "interests": 0, "offers": 0, "users": 0}

    for p in profiles or []:
        if upsert_user(
            p.get("id"),
            email=p.get("email"),
            full_name=p.get("full_name"),
            role=p.get("role"),
        ):
            counts["users"] += 1
            if p.get("startup_id"):
                link_user_startup(p["id"], p["startup_id"])
            if p.get("investor_id"):
                link_user_investor(p["id"], p["investor_id"])

    for s in startups:
        if upsert_startup(
            s.get("id"),
            name=s.get("name"),
            stage=s.get("stage"),
            industry=s.get("industry"),
            email=s.get("email"),
        ):
            counts["startups"] += 1

    for inv in investors:
        if upsert_investor(
            inv.get("id"),
            name=inv.get("display_name") or inv.get("name"),
            firm=inv.get("firm"),
            email=inv.get("email"),
        ):
            counts["investors"] += 1

    for pref in preferences:
        industries = pref.get("industries") or []
        if isinstance(industries, str):
            industries = [industries]
        set_investor_industries(pref.get("investor_id"), industries)

    for d in deals:
        if upsert_deal(
            d.get("id"),
            startup_id=d.get("startup_id"),
            title=d.get("title"),
            status=d.get("status"),
            industry=d.get("industry"),
            funding_stage=d.get("funding_stage"),
            target_raise=float(d["target_raise"]) if d.get("target_raise") is not None else None,
        ):
            counts["deals"] += 1

    deal_startup = {d.get("id"): d.get("startup_id") for d in deals}
    for interest in interests:
        deal_id = interest.get("deal_id")
        if express_interest(
            interest.get("investor_id"),
            deal_id,
            startup_id=deal_startup.get(deal_id),
            investor_name=interest.get("investor_name"),
            status=interest.get("status") or "interested",
        ):
            counts["interests"] += 1

    for offer in offers:
        if record_offer(
            offer.get("id"),
            offer.get("deal_id"),
            investor_id=offer.get("investor_id"),
            investor_name=offer.get("investor_name"),
            sender_type=offer.get("sender_type"),
            amount=float(offer["amount"]) if offer.get("amount") is not None else None,
            equity_pct=float(offer["equity_pct"]) if offer.get("equity_pct") is not None else None,
            royalty_pct=float(offer["royalty_pct"]) if offer.get("royalty_pct") is not None else None,
            status=offer.get("status"),
        ):
            counts["offers"] += 1

    return counts

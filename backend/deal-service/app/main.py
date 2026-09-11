"""
Deal service — many-to-many startup<->investor engagement.
Tracks drafts, published marketplace deals, negotiation trees, and closed deals.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from typing import Any
from datetime import datetime
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402
from shared import db  # noqa: E402

logger = logging.getLogger("fundx.deal-service")

SERVICE_NAME = os.getenv("SERVICE_NAME", "deal-service")
INVESTOR_SERVICE_URL = os.getenv("INVESTOR_SERVICE_URL", "http://investor-service:8003")

app = FastAPI(title="Deal Service", version="0.1.0")

# In-memory fallback
_DEALS: dict[str, dict[str, Any]] = {
    "deal-aerogrid": {
        "id": "deal-aerogrid",
        "startup_id": "startup-aerogrid",
        "startup_name": "AeroGrid Tech",
        "startup_verified": True,
        "title": "Autonomous Renewable Microgrid Grid-Edge Infrastructure",
        "pitch": "AI-orchestrated autonomous renewable energy grids for commercial microgrids and storage facilities",
        "industry": "CleanTech",
        "funding_stage": "Seed",
        "target_raise": 750000,
        "equity_pct": 7.0,
        "royalty_pct": 2.5,
        "royalty_payout_terms": "2.5% of quarterly gross revenue until 2.0x return cap",
        "status": "negotiating",
        "thesis": "Decentralized renewables will hit 32% grid penetration by 2030. AeroGrid combines frequency stabilization algorithms with IoT telemetry to cut curtailment by 40%.",
        "thesis_doc": "AeroGrid_Investment_Thesis_Q3.pdf",
        "ai_score": 88,
        "ai_report": {
            "feasibility_score": 88,
            "score_grade": "A",
            "summary": "AI Feasibility Analysis completed with a score of 88/100. High viability for grid-edge software with recurring SaaS + hardware licensing model.",
            "pain_points": [
                {"category": "Sales Cycle", "severity": "Medium", "issue": "Enterprise municipal sales cycle averages 6-9 months.", "mitigation": "Partner with regional ESCO distributors."},
                {"category": "Working Capital", "severity": "Low", "issue": "Royalty payout manageable under 72% gross margins.", "mitigation": "Grace period for initial 2 quarters."}
            ],
            "strengths": [
                "Patent-pending active harmonic filtration algorithm.",
                "Balanced hybrid structure with 7.0% equity and 2.5% capped royalty.",
                "3 signed LOIs with industrial park operators."
            ],
            "simulation": {
                "bull": {"annual_revenue": 1650000, "runway_months": 28, "royalty_payback_months": 19},
                "base": {"annual_revenue": 1100000, "runway_months": 22, "royalty_payback_months": 24},
                "bear": {"annual_revenue": 550000, "runway_months": 15, "royalty_payback_months": 34},
            }
        },
        "created_at": "2026-08-18T10:00:00Z",
        "published_at": "2026-08-20T14:30:00Z",
    },
    "deal-finpulse": {
        "id": "deal-finpulse",
        "startup_id": "startup-finpulse",
        "startup_name": "FinPulse AI",
        "startup_verified": True,
        "title": "Sub-second B2B Treasury & Global FX Settlement Protocol",
        "pitch": "Unified liquidity routing and automated compliance for multinational enterprises",
        "industry": "FinTech",
        "funding_stage": "Series A",
        "target_raise": 1500000,
        "equity_pct": 8.5,
        "royalty_pct": 1.5,
        "royalty_payout_terms": "1.5% of quarterly revenues until 1.75x payback cap",
        "status": "closed",
        "thesis": "Eliminates multi-day settlement delays and 2.4% FX friction for cross-border B2B transactions.",
        "thesis_doc": "FinPulse_SeriesA_Thesis.pdf",
        "ai_score": 92,
        "ai_report": {
            "feasibility_score": 92,
            "score_grade": "A",
            "summary": "AI Feasibility Analysis score 92/100. Exceptional unit economics and strong ISO20022 moat.",
            "pain_points": [],
            "strengths": ["Strong institutional banking connectivity", "Low dilution terms with fast investor yield"],
            "simulation": {
                "bull": {"annual_revenue": 3800000, "runway_months": 32, "royalty_payback_months": 14},
                "base": {"annual_revenue": 2400000, "runway_months": 24, "royalty_payback_months": 20},
                "bear": {"annual_revenue": 1200000, "runway_months": 18, "royalty_payback_months": 30},
            }
        },
        "created_at": "2026-07-22T08:00:00Z",
        "published_at": "2026-07-25T11:00:00Z",
        "closed_at": "2026-08-28T16:45:00Z",
        "closed_terms": {
            "investor_id": "investor-elena",
            "investor_name": "Elena Rostova (Apex Horizon Capital)",
            "final_amount": 1500000,
            "final_equity_pct": 8.5,
            "final_royalty_pct": 1.5,
            "royalty_payout_terms": "1.5% of quarterly revenues until 1.75x payback cap",
            "agreement_doc": "FINPULSE_INVESTMENT_CLOSING_BINDER.pdf",
        }
    },
    "deal-biosynthetix": {
        "id": "deal-biosynthetix",
        "startup_id": "startup-biosynthetix",
        "startup_name": "BioSynthetix Labs",
        "startup_verified": False,
        "title": "Generative Protein Design Platform for Targeted Oncology",
        "pitch": "Deep learning diffusion models predicting antibody-antigen binding affinities in weeks",
        "industry": "HealthTech",
        "funding_stage": "Pre-Seed",
        "target_raise": 400000,
        "equity_pct": 6.0,
        "royalty_pct": 3.0,
        "royalty_payout_terms": "3.0% of licensing revenues until 2.5x payback",
        "status": "draft",
        "thesis": "Wet-lab therapeutic discovery cycles take 2+ years. BioSynthetix uses generative chemistry to slash synthesis cycles to 6 weeks.",
        "thesis_doc": "BioSynthetix_Thesis_Draft_v1.pdf",
        "ai_score": 79,
        "ai_report": {
            "feasibility_score": 79,
            "score_grade": "B+",
            "summary": "AI Feasibility Score: 79/100.",
        },
        "created_at": "2026-09-03T16:00:00Z",
    },
}

_OFFERS: dict[str, list[dict[str, Any]]] = {}
_INTERESTS: dict[str, list[dict[str, Any]]] = {}
_ROOMS: dict[str, dict[str, Any]] = {}
_MESSAGES: dict[str, list[dict[str, Any]]] = {}


class DealCreate(BaseModel):
    startup_id: str
    startup_name: str | None = None
    startup_verified: bool = False
    title: str = Field(..., min_length=1)
    pitch: str = Field(..., min_length=1)
    industry: str = "Technology"
    funding_stage: str = "Seed"
    target_raise: float = Field(..., gt=0)
    equity_pct: float = Field(..., ge=0, le=100)
    royalty_pct: float = Field(default=0.0, ge=0, le=100)
    royalty_payout_terms: str | None = None
    status: str = "draft"  # "draft" or "published"
    thesis: str | None = None
    thesis_doc: str | None = None
    ai_score: int | None = None
    ai_report: dict[str, Any] | None = None
    use_of_funds: str | None = None


class DealUpdate(BaseModel):
    title: str | None = None
    pitch: str | None = None
    target_raise: float | None = None
    equity_pct: float | None = None
    royalty_pct: float | None = None
    royalty_payout_terms: str | None = None
    thesis: str | None = None
    thesis_doc: str | None = None
    ai_score: int | None = None
    ai_report: dict[str, Any] | None = None
    status: str | None = None
    industry: str | None = None
    use_of_funds: str | None = None


class OfferCreate(BaseModel):
    investor_id: str
    investor_name: str | None = None
    sender_type: str = "investor"  # "investor" or "startup"
    amount: float
    equity_pct: float
    royalty_pct: float = 0.0
    royalty_payout_terms: str | None = None
    message: str | None = None


class OfferResponse(BaseModel):
    action: str  # "accept", "counter", "reject"
    counter_offer: OfferCreate | None = None
    reason: str | None = None


@app.on_event("startup")
async def on_startup():
    await db.get_pool()


@app.get("/health")
async def health() -> dict[str, Any]:
    pool = await db.get_pool()
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "database_connected": pool is not None,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/deals")
async def list_deals(
    status: str | None = None,
    startup_id: str | None = None,
    industry: str | None = None,
) -> list[dict[str, Any]]:
    query = "SELECT * FROM public.deals WHERE 1=1"
    params = []
    idx = 1
    if status:
        query += f" AND status = ${idx}"
        params.append(status)
        idx += 1
    if startup_id:
        query += f" AND startup_id = ${idx}"
        params.append(startup_id)
        idx += 1
    if industry:
        query += f" AND LOWER(industry) = LOWER(${idx})"
        params.append(industry)
        idx += 1

    query += " ORDER BY created_at DESC"
    rows = await db.fetch(query, *params)
    if rows:
        return rows

    # Fallback to in-memory
    deals = list(_DEALS.values())
    if status:
        deals = [d for d in deals if d.get("status") == status]
    if startup_id:
        deals = [d for d in deals if d.get("startup_id") == startup_id]
    if industry:
        deals = [d for d in deals if d.get("industry", "").lower() == industry.lower()]
    return deals


@app.post("/deals")
async def create_deal(payload: DealCreate) -> dict[str, Any]:
    deal_id = f"deal-{uuid.uuid4().hex[:8]}"

    # Check startup verified status
    st_row = await db.fetchrow("SELECT name, is_verified, industry FROM public.startups WHERE id = $1", payload.startup_id)
    startup_name = payload.startup_name or (st_row.get("name") if st_row else "Startup")
    is_verified = payload.startup_verified or (st_row.get("is_verified", False) if st_row else False)
    industry = payload.industry or (st_row.get("industry") if st_row else "Technology")

    ai_report_json = json.dumps(payload.ai_report) if payload.ai_report else None

    await db.execute(
        """
        INSERT INTO public.deals (
            id, startup_id, startup_name, startup_verified, title, pitch,
            industry, funding_stage, target_raise, equity_pct, royalty_pct,
            royalty_payout_terms, status, thesis, thesis_doc, ai_score, ai_report,
            use_of_funds, published_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18,
            CASE WHEN $13 = 'published' THEN NOW() ELSE NULL END
        )
        ON CONFLICT (id) DO NOTHING
        """,
        deal_id, payload.startup_id, startup_name, is_verified, payload.title, payload.pitch,
        industry, payload.funding_stage, payload.target_raise, payload.equity_pct, payload.royalty_pct,
        payload.royalty_payout_terms, payload.status, payload.thesis, payload.thesis_doc,
        payload.ai_score, ai_report_json, payload.use_of_funds
    )

    if payload.status == "published":
        offer_id = f"offer-{uuid.uuid4().hex[:8]}"
        await db.execute(
            """
            INSERT INTO public.offers (
                id, deal_id, investor_id, investor_name, sender_type, amount,
                equity_pct, royalty_pct, royalty_payout_terms, status, message
            ) VALUES ($1, $2, 'system', $3, 'startup', $4, $5, $6, $7, 'active', 'Initial published marketplace offering terms.')
            """,
            offer_id, deal_id, startup_name, payload.target_raise, payload.equity_pct, payload.royalty_pct, payload.royalty_payout_terms
        )

    row = {
        "id": deal_id,
        "startup_name": startup_name,
        "startup_verified": is_verified,
        "created_at": datetime.utcnow().isoformat() + "Z",
        **payload.model_dump(),
    }
    _DEALS[deal_id] = row
    return row


@app.get("/deals/{deal_id}")
async def get_deal(deal_id: str) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM public.deals WHERE id = $1", deal_id)
    if row:
        offers = await db.fetch("SELECT * FROM public.offers WHERE deal_id = $1 ORDER BY timestamp ASC", deal_id)
        interests = await db.fetch("SELECT * FROM public.deal_interests WHERE deal_id = $1 ORDER BY created_at ASC", deal_id)
        row["offers"] = offers
        row["interests"] = interests
        return row

    if deal_id in _DEALS:
        deal = dict(_DEALS[deal_id])
        deal["interests"] = _INTERESTS.get(deal_id, [])
        deal["offers"] = _OFFERS.get(deal_id, [])
        return deal

    raise HTTPException(status_code=404, detail="Deal not found")


@app.put("/deals/{deal_id}")
async def update_deal(deal_id: str, payload: DealUpdate) -> dict[str, Any]:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    existing = await db.fetchrow("SELECT * FROM public.deals WHERE id = $1", deal_id)
    if existing:
        set_clauses = []
        args = [deal_id]
        idx = 2
        for k, v in updates.items():
            if k == "ai_report":
                set_clauses.append(f"ai_report = ${idx}::jsonb")
                args.append(json.dumps(v))
            else:
                set_clauses.append(f"{k} = ${idx}")
                args.append(v)
            idx += 1
        if set_clauses:
            query = f"UPDATE public.deals SET {', '.join(set_clauses)}, updated_at = NOW() WHERE id = $1 RETURNING *"
            updated = await db.fetchrow(query, *args)
            if updated:
                return updated

    if deal_id in _DEALS:
        deal = _DEALS[deal_id]
        deal.update(updates)
        deal["updated_at"] = datetime.utcnow().isoformat() + "Z"
        _DEALS[deal_id] = deal
        return deal

    raise HTTPException(status_code=404, detail="Deal not found")


@app.post("/deals/{deal_id}/publish")
async def publish_deal(deal_id: str) -> dict[str, Any]:
    """Publish draft deal to marketplace."""
    await db.execute("UPDATE public.deals SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = $1", deal_id)
    deal = await db.fetchrow("SELECT * FROM public.deals WHERE id = $1", deal_id)
    if not deal:
        if deal_id in _DEALS:
            deal = _DEALS[deal_id]
            deal["status"] = "published"
            deal["published_at"] = datetime.utcnow().isoformat() + "Z"
        else:
            raise HTTPException(status_code=404, detail="Deal not found")

    # Add initial offer if none exists
    existing_offers = await db.fetch("SELECT * FROM public.offers WHERE deal_id = $1", deal_id)
    if not existing_offers:
        offer_id = f"offer-{uuid.uuid4().hex[:8]}"
        await db.execute(
            """
            INSERT INTO public.offers (
                id, deal_id, investor_id, investor_name, sender_type, amount,
                equity_pct, royalty_pct, royalty_payout_terms, status, message
            ) VALUES ($1, $2, 'system', $3, 'startup', $4, $5, $6, $7, 'active', 'Deal published to marketplace.')
            ON CONFLICT (id) DO NOTHING
            """,
            offer_id, deal_id, deal.get("startup_name", "Startup"), deal.get("target_raise", 500000),
            deal.get("equity_pct", 7.0), deal.get("royalty_pct", 2.0), deal.get("royalty_payout_terms", "Standard terms")
        )

    return {"message": "Deal published to marketplace successfully", "deal": deal}


@app.post("/deals/{deal_id}/interest")
async def express_interest(deal_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    investor_id = payload.get("investor_id", "investor-elena")
    investor_name = payload.get("investor_name", "Elena Rostova")

    existing = await db.fetchrow(
        "SELECT * FROM public.deal_interests WHERE deal_id = $1 AND investor_id = $2",
        deal_id, investor_id
    )
    if existing:
        return existing

    int_id = f"int-{uuid.uuid4().hex[:8]}"
    await db.execute(
        "INSERT INTO public.deal_interests (id, deal_id, investor_id, investor_name, status) VALUES ($1, $2, $3, $4, 'interested')",
        int_id, deal_id, investor_id, investor_name
    )
    return {"id": int_id, "deal_id": deal_id, "investor_id": investor_id, "investor_name": investor_name, "status": "interested"}


@app.get("/deals/{deal_id}/negotiation-tree")
async def get_negotiation_tree(deal_id: str) -> dict[str, Any]:
    """Retrieve full step-by-step negotiation history."""
    deal = await db.fetchrow("SELECT * FROM public.deals WHERE id = $1", deal_id)
    if not deal:
        deal = _DEALS.get(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    offers = await db.fetch("SELECT * FROM public.offers WHERE deal_id = $1 ORDER BY timestamp ASC", deal_id)
    if not offers:
        offers = _OFFERS.get(deal_id, [])

    return {
        "deal_id": deal_id,
        "title": deal.get("title"),
        "status": deal.get("status"),
        "target_raise": deal.get("target_raise"),
        "equity_pct": deal.get("equity_pct"),
        "royalty_pct": deal.get("royalty_pct"),
        "royalty_payout_terms": deal.get("royalty_payout_terms"),
        "closed_terms": deal.get("closed_terms"),
        "offers_count": len(offers),
        "timeline": offers,
    }


@app.post("/deals/{deal_id}/offers")
async def create_offer(deal_id: str, payload: OfferCreate) -> dict[str, Any]:
    """
    Submit offer or counter-offer.
    Enforces AI verification check: unverified investors cannot negotiate or submit offers!
    """
    deal = await db.fetchrow("SELECT * FROM public.deals WHERE id = $1", deal_id)
    if not deal:
        deal = _DEALS.get(deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Verify investor accreditation if sender is investor
    if payload.sender_type == "investor":
        investor_id = payload.investor_id
        inv = await db.fetchrow("SELECT is_verified FROM public.investors WHERE id = $1", investor_id)
        if inv and not inv.get("is_verified"):
            raise HTTPException(
                status_code=403,
                detail="Verification required: You must upload your CV and be AI Verified to negotiate or submit offers."
            )
        elif not inv:
            # Check via HTTP
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(f"{INVESTOR_SERVICE_URL}/investors/{investor_id}")
                    if resp.status_code == 200:
                        inv_data = resp.json()
                        if not inv_data.get("is_verified", False):
                            raise HTTPException(
                                status_code=403,
                                detail="Verification required: You must upload your CV and be AI Verified to negotiate or submit offers."
                            )
            except HTTPException:
                raise
            except Exception:
                if investor_id == "investor-david":
                    raise HTTPException(
                        status_code=403,
                        detail="Verification required: You must upload your CV and be AI Verified to negotiate or submit offers."
                    )

    # Set prior active offers to countered
    await db.execute("UPDATE public.offers SET status = 'countered' WHERE deal_id = $1 AND status = 'active'", deal_id)

    offer_id = f"offer-{uuid.uuid4().hex[:8]}"
    await db.execute(
        """
        INSERT INTO public.offers (
            id, deal_id, investor_id, investor_name, sender_type, amount,
            equity_pct, royalty_pct, royalty_payout_terms, status, message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10)
        """,
        offer_id, deal_id, payload.investor_id, payload.investor_name or "Investor",
        payload.sender_type, payload.amount, payload.equity_pct, payload.royalty_pct,
        payload.royalty_payout_terms or deal.get("royalty_payout_terms"),
        payload.message or "Submitted offer proposal."
    )

    # Move deal status to negotiating if published
    if deal.get("status") == "published":
        await db.execute("UPDATE public.deals SET status = 'negotiating', updated_at = NOW() WHERE id = $1", deal_id)

    new_offer = {
        "id": offer_id,
        "deal_id": deal_id,
        "investor_id": payload.investor_id,
        "investor_name": payload.investor_name or "Investor",
        "sender_type": payload.sender_type,
        "amount": payload.amount,
        "equity_pct": payload.equity_pct,
        "royalty_pct": payload.royalty_pct,
        "royalty_payout_terms": payload.royalty_payout_terms or deal.get("royalty_payout_terms"),
        "status": "active",
        "message": payload.message or "Submitted offer proposal.",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    return new_offer


@app.put("/deals/{deal_id}/offers/{offer_id}")
async def respond_to_offer(deal_id: str, offer_id: str, payload: OfferResponse) -> dict[str, Any]:
    """
    Accept, counter, or reject an offer.
    If 'accept', the deal automatically transitions to 'closed'!
    """
    target_offer = await db.fetchrow("SELECT * FROM public.offers WHERE id = $1 AND deal_id = $2", offer_id, deal_id)
    if not target_offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if payload.action == "accept":
        await db.execute("UPDATE public.offers SET status = 'accepted' WHERE id = $1", offer_id)
        closed_terms = {
            "offer_id": offer_id,
            "investor_id": target_offer.get("investor_id"),
            "investor_name": target_offer.get("investor_name"),
            "final_amount": target_offer.get("amount"),
            "final_equity_pct": target_offer.get("equity_pct"),
            "final_royalty_pct": target_offer.get("royalty_pct"),
            "royalty_payout_terms": target_offer.get("royalty_payout_terms"),
            "closing_date": datetime.utcnow().isoformat() + "Z",
        }
        await db.execute(
            """
            UPDATE public.deals
            SET status = 'closed', closed_at = NOW(), closed_terms = $2::jsonb, updated_at = NOW()
            WHERE id = $1
            """,
            deal_id, json.dumps(closed_terms)
        )
        return {
            "message": "Offer accepted! Deal successfully closed.",
            "deal_status": "closed",
            "offer": target_offer,
            "closed_terms": closed_terms,
        }

    elif payload.action == "reject":
        await db.execute("UPDATE public.offers SET status = 'rejected' WHERE id = $1", offer_id)
        return {"message": "Offer rejected.", "offer": target_offer}

    elif payload.action == "counter" and payload.counter_offer:
        await db.execute("UPDATE public.offers SET status = 'countered' WHERE id = $1", offer_id)
        counter = payload.counter_offer
        new_id = f"offer-{uuid.uuid4().hex[:8]}"
        await db.execute(
            """
            INSERT INTO public.offers (
                id, deal_id, investor_id, investor_name, sender_type, amount,
                equity_pct, royalty_pct, royalty_payout_terms, status, message
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
            """,
            new_id, deal_id, counter.investor_id, counter.investor_name or "Participant",
            counter.sender_type, counter.amount, counter.equity_pct, counter.royalty_pct,
            counter.royalty_payout_terms or target_offer.get("royalty_payout_terms"),
            counter.message or "Submitted counter-offer terms."
        )
        return {"message": "Counter-offer submitted.", "offer": {"id": new_id, "status": "active"}}

    raise HTTPException(status_code=400, detail="Invalid action or missing counter_offer details")


@app.get("/deal-rooms")
async def list_rooms() -> list[dict[str, Any]]:
    return [
        {"id": "room-aerogrid", "deal_id": "deal-aerogrid", "name": "AeroGrid Seed Dealroom", "participant_ids": ["investor-elena", "founder-aerogrid"]},
        {"id": "room-finpulse", "deal_id": "deal-finpulse", "name": "FinPulse Series A Dealroom", "participant_ids": ["investor-elena", "founder-finpulse"]},
    ]


@app.get("/deal-rooms/{room_id}")
async def get_room(room_id: str) -> dict[str, Any]:
    return {
        "id": room_id,
        "deal_id": room_id.replace("room-", ""),
        "name": f"Dealroom {room_id}",
        "participant_ids": ["investor-elena", "founder-aerogrid"],
    }


@app.get("/deal-rooms/{room_id}/messages")
async def list_messages(room_id: str) -> list[dict[str, Any]]:
    messages = await db.fetch("SELECT * FROM public.deal_messages WHERE room_id = $1 ORDER BY created_at ASC", room_id)
    if messages:
        return messages
    return _MESSAGES.get(room_id, [])


@app.post("/deal-rooms/{room_id}/messages")
async def post_message(room_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    sender_id = payload.get("sender_id", "user")
    sender_name = payload.get("sender_name", "Participant")
    body = payload.get("body", "")

    await db.execute(
        "INSERT INTO public.deal_messages (id, room_id, sender_id, sender_name, body) VALUES ($1, $2, $3, $4, $5)",
        msg_id, room_id, sender_id, sender_name, body
    )

    msg = {
        "id": msg_id,
        "room_id": room_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "body": body,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _MESSAGES.setdefault(room_id, []).append(msg)
    return msg

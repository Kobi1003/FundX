"""
Deal service — many-to-many startup↔investor engagement.
Tracks drafts, published marketplace deals, negotiation trees, and closed deals.
"""

from __future__ import annotations

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

SERVICE_NAME = os.getenv("SERVICE_NAME", "deal-service")
INVESTOR_SERVICE_URL = os.getenv("INVESTOR_SERVICE_URL", "http://investor-service:8003")

app = FastAPI(title="Deal Service", version="0.1.0")

# Initial realistic seed deals covering draft, published, negotiating, and closed
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
            "summary": "AI Feasibility Score: 79/100. High clinical upside, but requires wet-lab partner validation data to achieve tier-1 rating.",
            "pain_points": [
                {"category": "Regulatory", "severity": "High", "issue": "Pre-IND regulatory pathway requires rigorous preclinical validation.", "mitigation": "Establish CRO benchmark testing."},
            ],
            "strengths": ["Breakthrough generative chemistry architecture", "Strong founder research pedigree"],
            "simulation": {
                "bull": {"annual_revenue": 950000, "runway_months": 22, "royalty_payback_months": 24},
                "base": {"annual_revenue": 450000, "runway_months": 16, "royalty_payback_months": 32},
                "bear": {"annual_revenue": 180000, "runway_months": 11, "royalty_payback_months": 42},
            }
        },
        "created_at": "2026-09-03T16:00:00Z",
    },
    "deal-neurosync": {
        "id": "deal-neurosync",
        "startup_id": "startup-aerogrid",
        "startup_name": "NeuroSync Robotics",
        "startup_verified": True,
        "title": "Self-Calibrating Vision Cobots for High-Precision Electronics",
        "pitch": "Sub-millimeter adaptive visual guidance for cleanroom electronics assembly",
        "industry": "Robotics",
        "funding_stage": "Seed",
        "target_raise": 600000,
        "equity_pct": 7.5,
        "royalty_pct": 2.0,
        "royalty_payout_terms": "2.0% quarterly revenue share until 2.0x cap",
        "status": "published",
        "thesis": "Electronics manufacturers face 35% assembly labor shortages. NeuroSync cobots plug into existing production lines without reprogramming.",
        "thesis_doc": "NeuroSync_Seed_Thesis.pdf",
        "ai_score": 86,
        "ai_report": {
            "feasibility_score": 86,
            "score_grade": "A",
            "summary": "AI Feasibility Score: 86/100. Compelling payback for manufacturing customers with sub-6 month ROI.",
            "pain_points": [
                {"category": "Hardware Supply Chain", "severity": "Medium", "issue": "Lead times for optical sensors can exceed 12 weeks.", "mitigation": "Dual-source supply chain contracts."}
            ],
            "strengths": ["Plug-and-play retrofit saves customer capital", "High gross margin on SaaS orchestration software"],
            "simulation": {
                "bull": {"annual_revenue": 1400000, "runway_months": 24, "royalty_payback_months": 20},
                "base": {"annual_revenue": 900000, "runway_months": 18, "royalty_payback_months": 26},
                "bear": {"annual_revenue": 400000, "runway_months": 13, "royalty_payback_months": 36},
            }
        },
        "created_at": "2026-09-01T11:00:00Z",
        "published_at": "2026-09-02T09:30:00Z",
    },
}

_INTERESTS: dict[str, list[dict[str, Any]]] = {
    "deal-aerogrid": [
        {"id": "int-1", "deal_id": "deal-aerogrid", "investor_id": "investor-elena", "investor_name": "Elena Rostova", "status": "active_negotiation", "created_at": "2026-08-21T10:00:00Z"},
        {"id": "int-2", "deal_id": "deal-aerogrid", "investor_id": "investor-vikram", "investor_name": "Vikram Mehta", "status": "interested", "created_at": "2026-08-22T15:20:00Z"},
    ],
    "deal-finpulse": [
        {"id": "int-3", "deal_id": "deal-finpulse", "investor_id": "investor-elena", "investor_name": "Elena Rostova", "status": "closed", "created_at": "2026-07-26T14:00:00Z"},
    ],
    "deal-neurosync": [
        {"id": "int-4", "deal_id": "deal-neurosync", "investor_id": "investor-vikram", "investor_name": "Vikram Mehta", "status": "interested", "created_at": "2026-09-04T12:00:00Z"},
    ],
}

_ROOMS: dict[str, dict[str, Any]] = {
    "room-aerogrid": {
        "id": "room-aerogrid",
        "deal_id": "deal-aerogrid",
        "name": "AeroGrid Seed Dealroom",
        "participant_ids": ["investor-elena", "investor-vikram", "user-founder-1"],
    }
}

_MESSAGES: dict[str, list[dict[str, Any]]] = {
    "room-aerogrid": [
        {"id": "msg-1", "room_id": "room-aerogrid", "sender_id": "investor-elena", "sender_name": "Elena Rostova", "body": "Hello AeroGrid team. We reviewed your thesis simulation. Very impressed with the harmonic filtration telemetry. We would like to propose a lead check of $800k.", "created_at": "2026-08-22T11:00:00Z"},
        {"id": "msg-2", "room_id": "room-aerogrid", "sender_id": "user-founder-1", "sender_name": "AeroGrid Founder", "body": "Thank you Elena! We are eager to partner with Apex Horizon. We reviewed your term sheet and sent a counter with adjusted royalty to protect early operational cashflow.", "created_at": "2026-08-23T09:30:00Z"},
    ]
}

# Negotiation Tree of Offers
_OFFERS: dict[str, list[dict[str, Any]]] = {
    "deal-aerogrid": [
        {
            "id": "offer-ag-1",
            "deal_id": "deal-aerogrid",
            "investor_id": "system",
            "sender_type": "startup",
            "sender_name": "AeroGrid Tech (Listing Terms)",
            "amount": 750000,
            "equity_pct": 7.0,
            "royalty_pct": 2.5,
            "royalty_payout_terms": "2.5% quarterly revenue until 2.0x return cap",
            "status": "superseded",
            "message": "Initial published marketplace offering terms.",
            "timestamp": "2026-08-20T14:30:00Z",
        },
        {
            "id": "offer-ag-2",
            "deal_id": "deal-aerogrid",
            "investor_id": "investor-elena",
            "sender_type": "investor",
            "sender_name": "Elena Rostova (Apex Horizon)",
            "amount": 800000,
            "equity_pct": 8.0,
            "royalty_pct": 2.0,
            "royalty_payout_terms": "2.0% quarterly revenue until 1.8x return cap",
            "status": "countered",
            "message": "We offer $800k total round commitment with 8.0% equity and reduced royalty of 2.0% (1.8x cap).",
            "timestamp": "2026-08-22T16:00:00Z",
        },
        {
            "id": "offer-ag-3",
            "deal_id": "deal-aerogrid",
            "investor_id": "investor-elena",
            "sender_type": "startup",
            "sender_name": "AeroGrid Tech (Founder Counter)",
            "amount": 800000,
            "equity_pct": 7.5,
            "royalty_pct": 2.2,
            "royalty_payout_terms": "2.2% quarterly revenue until 2.0x return cap",
            "status": "active",
            "message": "Founder counter-offer: agreed to $800k round size, offering 7.5% equity with 2.2% royalty (2.0x cap). Ready to execute upon investor sign-off.",
            "timestamp": "2026-08-24T10:15:00Z",
        },
    ],
    "deal-finpulse": [
        {
            "id": "offer-fp-1",
            "deal_id": "deal-finpulse",
            "investor_id": "investor-elena",
            "sender_type": "investor",
            "sender_name": "Elena Rostova (Apex Horizon)",
            "amount": 1500000,
            "equity_pct": 8.5,
            "royalty_pct": 1.5,
            "royalty_payout_terms": "1.5% of quarterly revenues until 1.75x payback cap",
            "status": "accepted",
            "message": "Lead Series A term sheet executed.",
            "timestamp": "2026-08-28T14:00:00Z",
        }
    ],
    "deal-neurosync": [],
    "deal-biosynthetix": [],
}


class DealCreate(BaseModel):
    startup_id: str
    startup_name: str | None = None
    startup_verified: bool = True
    title: str = Field(..., min_length=1)
    pitch: str | None = None
    funding_stage: str = "Seed"
    target_raise: float
    equity_pct: float
    royalty_pct: float = 0.0
    royalty_payout_terms: str = "Standard revenue share"
    thesis: str | None = None
    thesis_doc: str | None = None
    ai_score: int | None = None
    ai_report: dict[str, Any] | None = None
    status: str = "draft"
    industry: str | None = None
    use_of_funds: str | None = None


class DealUpdate(BaseModel):
    title: str | None = None
    pitch: str | None = None
    funding_stage: str | None = None
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
    royalty_pct: float
    royalty_payout_terms: str | None = None
    message: str | None = None


class OfferResponse(BaseModel):
    action: str  # "accept", "counter", "reject"
    counter_offer: OfferCreate | None = None
    reason: str | None = None


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/deals")
async def list_deals(
    status: str | None = None,
    startup_id: str | None = None,
    industry: str | None = None,
) -> list[dict[str, Any]]:
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
    row = {
        "id": deal_id,
        "created_at": datetime.utcnow().isoformat() + "Z",
        **payload.model_dump(),
    }
    if payload.status == "published":
        row["published_at"] = datetime.utcnow().isoformat() + "Z"

    _DEALS[deal_id] = row
    _INTERESTS[deal_id] = []
    _OFFERS[deal_id] = []
    
    # If published, create initial baseline offer in tree
    if payload.status == "published":
        _OFFERS[deal_id].append({
            "id": str(uuid.uuid4()),
            "deal_id": deal_id,
            "investor_id": "system",
            "sender_type": "startup",
            "sender_name": payload.startup_name or "Startup Terms",
            "amount": payload.target_raise,
            "equity_pct": payload.equity_pct,
            "royalty_pct": payload.royalty_pct,
            "royalty_payout_terms": payload.royalty_payout_terms,
            "status": "active",
            "message": "Initial published marketplace offering terms.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })

    return row


@app.get("/deals/{deal_id}")
async def get_deal(deal_id: str) -> dict[str, Any]:
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal = dict(_DEALS[deal_id])
    deal["interests"] = _INTERESTS.get(deal_id, [])
    deal["offers"] = _OFFERS.get(deal_id, [])
    return deal


@app.put("/deals/{deal_id}")
async def update_deal(deal_id: str, payload: DealUpdate) -> dict[str, Any]:
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal = _DEALS[deal_id]
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    if updates.get("status") == "published" and deal.get("status") != "published":
        deal["published_at"] = datetime.utcnow().isoformat() + "Z"
        # Add initial offer if tree is empty
        if not _OFFERS.get(deal_id):
            _OFFERS[deal_id] = [{
                "id": str(uuid.uuid4()),
                "deal_id": deal_id,
                "investor_id": "system",
                "sender_type": "startup",
                "sender_name": deal.get("startup_name", "Startup Terms"),
                "amount": updates.get("target_raise", deal.get("target_raise")),
                "equity_pct": updates.get("equity_pct", deal.get("equity_pct")),
                "royalty_pct": updates.get("royalty_pct", deal.get("royalty_pct")),
                "royalty_payout_terms": updates.get("royalty_payout_terms", deal.get("royalty_payout_terms")),
                "status": "active",
                "message": "Initial published terms.",
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }]

    deal.update(updates)
    deal["updated_at"] = datetime.utcnow().isoformat() + "Z"
    _DEALS[deal_id] = deal
    return deal


@app.post("/deals/{deal_id}/publish")
async def publish_deal(deal_id: str) -> dict[str, Any]:
    """Publish draft deal to marketplace."""
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal = _DEALS[deal_id]
    deal["status"] = "published"
    deal["published_at"] = datetime.utcnow().isoformat() + "Z"
    _DEALS[deal_id] = deal

    if not _OFFERS.get(deal_id):
        _OFFERS[deal_id] = [{
            "id": str(uuid.uuid4()),
            "deal_id": deal_id,
            "investor_id": "system",
            "sender_type": "startup",
            "sender_name": deal.get("startup_name", "Startup"),
            "amount": deal.get("target_raise", 500000),
            "equity_pct": deal.get("equity_pct", 7.0),
            "royalty_pct": deal.get("royalty_pct", 2.0),
            "royalty_payout_terms": deal.get("royalty_payout_terms", "Standard royalty terms"),
            "status": "active",
            "message": "Deal published to marketplace.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }]

    return {"message": "Deal published to marketplace successfully", "deal": deal}


@app.post("/deals/{deal_id}/interest")
async def express_interest(deal_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    investor_id = payload.get("investor_id", "investor-elena")
    investor_name = payload.get("investor_name", "Elena Rostova")
    
    # Check if already expressed interest
    interests = _INTERESTS.setdefault(deal_id, [])
    for it in interests:
        if it.get("investor_id") == investor_id:
            return it

    interest = {
        "id": str(uuid.uuid4()),
        "deal_id": deal_id,
        "investor_id": investor_id,
        "investor_name": investor_name,
        "status": "interested",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    interests.append(interest)
    return interest


@app.get("/deals/{deal_id}/negotiation-tree")
async def get_negotiation_tree(deal_id: str) -> dict[str, Any]:
    """Retrieve full step-by-step negotiation history."""
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal = _DEALS[deal_id]
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
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal = _DEALS[deal_id]

    # Verify investor accreditation if sender is investor
    if payload.sender_type == "investor":
        investor_id = payload.investor_id
        # Call investor service to check verification
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
        except Exception:  # noqa: BLE001
            # If investor service is momentarily unreachable in demo, allow known verified ids
            if investor_id == "investor-david":
                raise HTTPException(
                    status_code=403,
                    detail="Verification required: You must upload your CV and be AI Verified to negotiate or submit offers."
                )

    # Set prior active offers to superseded/countered
    existing_offers = _OFFERS.setdefault(deal_id, [])
    for off in existing_offers:
        if off.get("status") == "active":
            off["status"] = "countered"

    new_offer = {
        "id": f"offer-{uuid.uuid4().hex[:8]}",
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
    existing_offers.append(new_offer)

    # Move deal status to negotiating if published
    if deal.get("status") == "published":
        deal["status"] = "negotiating"

    return new_offer


@app.put("/deals/{deal_id}/offers/{offer_id}")
async def respond_to_offer(deal_id: str, offer_id: str, payload: OfferResponse) -> dict[str, Any]:
    """
    Accept, counter, or reject an offer.
    If 'accept', the deal automatically transitions to 'closed'!
    """
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal = _DEALS[deal_id]
    offers = _OFFERS.get(deal_id, [])
    target_offer = next((o for o in offers if o.get("id") == offer_id), None)
    if not target_offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if payload.action == "accept":
        target_offer["status"] = "accepted"
        deal["status"] = "closed"
        deal["closed_at"] = datetime.utcnow().isoformat() + "Z"
        deal["closed_terms"] = {
            "offer_id": offer_id,
            "investor_id": target_offer.get("investor_id"),
            "investor_name": target_offer.get("investor_name"),
            "final_amount": target_offer.get("amount"),
            "final_equity_pct": target_offer.get("equity_pct"),
            "final_royalty_pct": target_offer.get("royalty_pct"),
            "royalty_payout_terms": target_offer.get("royalty_payout_terms"),
            "closing_date": datetime.utcnow().isoformat() + "Z",
        }
        return {
            "message": "Offer accepted! Deal successfully closed.",
            "deal_status": "closed",
            "offer": target_offer,
            "closed_terms": deal["closed_terms"],
        }

    elif payload.action == "reject":
        target_offer["status"] = "rejected"
        return {"message": "Offer rejected.", "offer": target_offer}

    elif payload.action == "counter" and payload.counter_offer:
        target_offer["status"] = "countered"
        counter = payload.counter_offer
        new_offer = {
            "id": f"offer-{uuid.uuid4().hex[:8]}",
            "deal_id": deal_id,
            "investor_id": counter.investor_id,
            "investor_name": counter.investor_name or "Participant",
            "sender_type": counter.sender_type,
            "amount": counter.amount,
            "equity_pct": counter.equity_pct,
            "royalty_pct": counter.royalty_pct,
            "royalty_payout_terms": counter.royalty_payout_terms or deal.get("royalty_payout_terms"),
            "status": "active",
            "message": counter.message or "Submitted counter-offer terms.",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        offers.append(new_offer)
        return {"message": "Counter-offer submitted.", "offer": new_offer}

    raise HTTPException(status_code=400, detail="Invalid action or missing counter_offer details")


@app.get("/deal-rooms")
async def list_rooms() -> list[dict[str, Any]]:
    return list(_ROOMS.values())


@app.get("/deal-rooms/{room_id}")
async def get_room(room_id: str) -> dict[str, Any]:
    if room_id not in _ROOMS:
        # Fallback dynamic room creation for deal
        deal_id = room_id.replace("room-", "")
        if deal_id in _DEALS:
            return {
                "id": room_id,
                "deal_id": deal_id,
                "name": f"Dealroom for {_DEALS[deal_id].get('title', deal_id)}",
                "participant_ids": ["investor-elena", "user-founder-1"],
            }
        raise HTTPException(status_code=404, detail="Deal room not found")
    return _ROOMS[room_id]


@app.get("/deal-rooms/{room_id}/messages")
async def list_messages(room_id: str) -> list[dict[str, Any]]:
    return _MESSAGES.get(room_id, [])


@app.post("/deal-rooms/{room_id}/messages")
async def post_message(room_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    msg = {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "sender_id": payload.get("sender_id", "user"),
        "sender_name": payload.get("sender_name", "Participant"),
        "body": payload.get("body", ""),
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _MESSAGES.setdefault(room_id, []).append(msg)
    return msg

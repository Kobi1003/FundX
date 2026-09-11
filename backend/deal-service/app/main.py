"""
Deal service — many-to-many startup↔investor engagement.

Deal rooms are NOT 1:1. One deal can have many investors; one investor can
join many deals/rooms via deal_room_participants.
"""

from __future__ import annotations

import os
import sys
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, "/app")

from shared.neo4j_client import health_check as neo4j_health  # noqa: E402
from shared.supabase_client import supabase_configured  # noqa: E402

SERVICE_NAME = os.getenv("SERVICE_NAME", "deal-service")

app = FastAPI(title="Deal Service", version="0.1.0")

_DEALS: dict[str, dict[str, Any]] = {}
_INTERESTS: dict[str, list[dict[str, Any]]] = {}
_ROOMS: dict[str, dict[str, Any]] = {}
_MESSAGES: dict[str, list[dict[str, Any]]] = {}
_OFFERS: dict[str, list[dict[str, Any]]] = {}


class DealCreate(BaseModel):
    startup_id: str
    title: str = Field(..., min_length=1)
    target_raise: float | None = None
    status: str = "open"


class InterestCreate(BaseModel):
    investor_id: str
    status: str = "interested"


class DealRoomCreate(BaseModel):
    deal_id: str
    name: str | None = None
    participant_ids: list[str] = Field(default_factory=list)


class MessageCreate(BaseModel):
    sender_id: str
    body: str = Field(..., min_length=1)


class OfferCreate(BaseModel):
    investor_id: str
    amount: float
    equity_pct: float | None = None
    terms: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "supabase_configured": supabase_configured(),
        "neo4j": neo4j_health(),
    }


@app.get("/deals")
async def list_deals() -> list[dict[str, Any]]:
    return list(_DEALS.values())


@app.post("/deals")
async def create_deal(payload: DealCreate) -> dict[str, Any]:
    deal_id = str(uuid.uuid4())
    row = {"id": deal_id, **payload.model_dump()}
    _DEALS[deal_id] = row
    _INTERESTS[deal_id] = []
    return row


@app.get("/deals/{deal_id}")
async def get_deal(deal_id: str) -> dict[str, Any]:
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal = dict(_DEALS[deal_id])
    deal["interests"] = _INTERESTS.get(deal_id, [])
    return deal


@app.post("/deals/{deal_id}/interest")
async def express_interest(deal_id: str, payload: InterestCreate) -> dict[str, Any]:
    if deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    interest = {"id": str(uuid.uuid4()), "deal_id": deal_id, **payload.model_dump()}
    _INTERESTS.setdefault(deal_id, []).append(interest)
    return interest


@app.get("/deal-rooms")
async def list_rooms() -> list[dict[str, Any]]:
    return list(_ROOMS.values())


@app.post("/deal-rooms")
async def create_room(payload: DealRoomCreate) -> dict[str, Any]:
    if payload.deal_id not in _DEALS:
        raise HTTPException(status_code=404, detail="Deal not found")
    room_id = str(uuid.uuid4())
    room = {
        "id": room_id,
        "deal_id": payload.deal_id,
        "name": payload.name or f"Room for deal {payload.deal_id[:8]}",
        "participant_ids": list(payload.participant_ids),
    }
    _ROOMS[room_id] = room
    _MESSAGES[room_id] = []
    _OFFERS[room_id] = []
    return room


@app.get("/deal-rooms/{room_id}")
async def get_room(room_id: str) -> dict[str, Any]:
    if room_id not in _ROOMS:
        raise HTTPException(status_code=404, detail="Deal room not found")
    return _ROOMS[room_id]


@app.get("/deal-rooms/{room_id}/messages")
async def list_messages(room_id: str) -> list[dict[str, Any]]:
    if room_id not in _ROOMS:
        raise HTTPException(status_code=404, detail="Deal room not found")
    return _MESSAGES.get(room_id, [])


@app.post("/deal-rooms/{room_id}/messages")
async def post_message(room_id: str, payload: MessageCreate) -> dict[str, Any]:
    if room_id not in _ROOMS:
        raise HTTPException(status_code=404, detail="Deal room not found")
    msg = {"id": str(uuid.uuid4()), "room_id": room_id, **payload.model_dump()}
    _MESSAGES.setdefault(room_id, []).append(msg)
    return msg


@app.get("/deal-rooms/{room_id}/offers")
async def list_offers(room_id: str) -> list[dict[str, Any]]:
    if room_id not in _ROOMS:
        raise HTTPException(status_code=404, detail="Deal room not found")
    return _OFFERS.get(room_id, [])


@app.post("/deal-rooms/{room_id}/offers")
async def create_offer(room_id: str, payload: OfferCreate) -> dict[str, Any]:
    if room_id not in _ROOMS:
        raise HTTPException(status_code=404, detail="Deal room not found")
    room = _ROOMS[room_id]
    offer = {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "deal_id": room["deal_id"],
        "status": "pending",
        **payload.model_dump(),
    }
    _OFFERS.setdefault(room_id, []).append(offer)
    return offer

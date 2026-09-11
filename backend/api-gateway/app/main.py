"""API Gateway — frontend entry point; proxies to internal microservices."""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SERVICE_NAME = os.getenv("SERVICE_NAME", "api-gateway")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
STARTUP_SERVICE_URL = os.getenv("STARTUP_SERVICE_URL", "http://startup-service:8002")
INVESTOR_SERVICE_URL = os.getenv("INVESTOR_SERVICE_URL", "http://investor-service:8003")
DEAL_SERVICE_URL = os.getenv("DEAL_SERVICE_URL", "http://deal-service:8004")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8005")

ROUTE_MAP = {
    "users": USER_SERVICE_URL,
    "startups": STARTUP_SERVICE_URL,
    "investors": INVESTOR_SERVICE_URL,
    "deals": DEAL_SERVICE_URL,
    "deal-rooms": DEAL_SERVICE_URL,
    "ai": AI_SERVICE_URL,
}

app = FastAPI(title="AI Investment Arena — API Gateway", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    downstream: dict[str, Any] = Field(default_factory=dict)


async def _probe(client: httpx.AsyncClient, name: str, base_url: str) -> dict[str, Any]:
    try:
        resp = await client.get(f"{base_url}/health", timeout=3.0)
        return {"status": "ok" if resp.status_code == 200 else "degraded", "code": resp.status_code}
    except Exception as exc:  # noqa: BLE001
        return {"status": "unavailable", "error": str(exc)}


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    async with httpx.AsyncClient() as client:
        downstream = {
            "user-service": await _probe(client, "user", USER_SERVICE_URL),
            "startup-service": await _probe(client, "startup", STARTUP_SERVICE_URL),
            "investor-service": await _probe(client, "investor", INVESTOR_SERVICE_URL),
            "deal-service": await _probe(client, "deal", DEAL_SERVICE_URL),
            "ai-service": await _probe(client, "ai", AI_SERVICE_URL),
        }
    overall = "ok" if all(v.get("status") == "ok" for v in downstream.values()) else "degraded"
    return HealthResponse(status=overall, service=SERVICE_NAME, downstream=downstream)


def _auth_header_present(request: Request) -> bool:
    auth = request.headers.get("authorization")
    return bool(auth and auth.lower().startswith("bearer "))


async def _proxy(request: Request, base_url: str, path: str) -> Response:
    """Forward request to an internal service. Internal URLs stay off the frontend."""
    url = f"{base_url}/{path}".rstrip("/")
    if request.url.query:
        url = f"{url}?{request.url.query}"

    headers = {k: v for k, v in request.headers.items() if k.lower() not in {"host", "content-length"}}
    body = await request.body()

    async with httpx.AsyncClient() as client:
        try:
            upstream = await client.request(
                request.method,
                url,
                headers=headers,
                content=body,
                timeout=60.0,
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Upstream unavailable: {exc}") from exc

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers={
            k: v
            for k, v in upstream.headers.items()
            if k.lower() not in {"content-encoding", "transfer-encoding", "content-length"}
        },
        media_type=upstream.headers.get("content-type"),
    )


@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@app.api_route("/api/{service}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def gateway(service: str, request: Request, path: str = "") -> Response:
    if service not in ROUTE_MAP:
        raise HTTPException(status_code=404, detail=f"Unknown service route: {service}")

    # Middleware structure for auth — enforce later per-route; log presence for now
    _ = _auth_header_present(request)

    base = ROUTE_MAP[service]
    # users: /api/users/profile → user-service /profile
    # startups|investors|deals|deal-rooms|ai: preserve resource prefix on the service
    if service == "users":
        target_path = path
    else:
        target_path = f"{service}/{path}" if path else service

    return await _proxy(request, base, target_path)


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": SERVICE_NAME, "message": "AI Investment Arena API Gateway"}

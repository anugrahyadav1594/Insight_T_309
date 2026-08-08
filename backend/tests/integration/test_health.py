"""Health endpoint tests (§24.2)."""

from __future__ import annotations

from httpx import AsyncClient


async def test_health_shape(client: AsyncClient):
    resp = await client.get("/health")
    # Degraded (503) is acceptable if redis/db is down; the shape must be stable.
    assert resp.status_code in (200, 503)
    body = resp.json()
    for key in ("status", "version", "database", "redis", "market_data_provider", "uptime_s"):
        assert key in body
    assert body["market_data_provider"] in ("available", "unavailable", "degraded")
    assert body["database"] in ("ok", "unavailable")
    # Never expose keys/URLs.
    assert "apikey" not in resp.text.lower()
    assert "financialmodelingprep" not in resp.text.lower()
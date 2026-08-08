"""Integration tests for the screener (structured + NL, no SQL) (§24.2)."""

from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import auth_headers, register


async def _token(client: AsyncClient, email: str) -> str:
    return (await register(client, email=email))["access_token"]


async def test_structured_filter(client: AsyncClient):
    token = await _token(client, "sc1@example.com")
    resp = await client.post("/api/v1/screener/query", headers=auth_headers(token), json={
        "filters": {"sector": "Technology", "roe_min": 20, "debt_to_equity_max": 0.5},
        "sort_by": "overall_score", "order": "desc", "limit": 25, "offset": 0,
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["query_id"]
    assert data["applied_filters"]["sector"] == "Technology"
    assert data["count"] > 0
    tickers = {r["ticker"] for r in data["results"]}
    assert "TCS" in tickers
    assert all(r["sector"] == "Technology" for r in data["results"])


async def test_structured_filter_empty_result(client: AsyncClient):
    token = await _token(client, "sc2@example.com")
    resp = await client.post("/api/v1/screener/query", headers=auth_headers(token), json={
        "filters": {"sector": "NotARealSector"},
        "limit": 10,
    })
    assert resp.status_code == 200
    assert resp.json()["data"]["count"] == 0


async def test_invalid_filter_422(client: AsyncClient):
    token = await _token(client, "sc3@example.com")
    resp = await client.post("/api/v1/screener/query", headers=auth_headers(token), json={
        "filters": {"roe_min": 90, "roe_max": 10},
    })
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_natural_language_mode(client: AsyncClient):
    # Mock LLM fails to emit a filter, so the deterministic keyword parser runs.
    token = await _token(client, "sc4@example.com")
    resp = await client.post("/api/v1/screener/query", headers=auth_headers(token), json={
        "natural_language": "Find fundamentally strong IT companies with ROE above 20 and low debt",
        "limit": 10,
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["applied_filters"]["sector"] == "Technology"
    assert data["applied_filters"]["roe_min"] == 20
    assert data["count"] > 0


async def test_unknown_fields_rejected(client: AsyncClient):
    token = await _token(client, "sc5@example.com")
    resp = await client.post("/api/v1/screener/query", headers=auth_headers(token), json={
        "filters": {"sector": "Technology", "injected": True},
    })
    assert resp.status_code == 422
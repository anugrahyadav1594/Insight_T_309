"""Integration tests for company search + analysis pipeline (§24.2)."""

from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import auth_headers, register


async def test_search_returns_seeded_company(client: AsyncClient):
    token = (await register(client, email="s1@example.com"))["access_token"]
    resp = await client.get("/api/v1/companies/search", params={"q": "tcs"},
                            headers=auth_headers(token))
    assert resp.status_code == 200
    body = resp.json()["data"]
    assert body["total"] >= 1
    tickers = [i["ticker"] for i in body["items"]]
    assert "TCS" in tickers


async def test_search_exact_ticker_ranks_first(client: AsyncClient):
    token = (await register(client, email="s2@example.com"))["access_token"]
    resp = await client.get("/api/v1/companies/search", params={"q": "INFY"},
                            headers=auth_headers(token))
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    assert items[0]["ticker"] == "INFY"


async def test_search_empty_returns_zero_not_404(client: AsyncClient):
    token = (await register(client, email="s3@example.com"))["access_token"]
    resp = await client.get("/api/v1/companies/search", params={"q": "zzzznotfound"},
                            headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["data"]["items"] == []
    assert resp.json()["data"]["total"] == 0


async def test_search_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/companies/search", params={"q": "tcs"})
    assert resp.status_code == 401


async def test_analysis_pipeline(client: AsyncClient):
    token = (await register(client, email="s4@example.com"))["access_token"]
    resp = await client.get("/api/v1/companies/TCS", headers=auth_headers(token))
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ticker"] == "TCS"
    assert data["identity"]["name"]
    assert data["raw_data"]["price"] is not None
    assert "overall" in data["scores"]
    assert data["scores"]["overall"]["recommendation"] in (
        "STRONG_BUY", "BUY", "HOLD", "NEUTRAL", "BEARISH")
    assert data["ai"]["summary"]
    assert "data_as_of" in data
    assert "stale" in data


async def test_analysis_unknown_ticker_with_working_provider(client: AsyncClient):
    # Mock provider synthesizes data for any ticker -> 200.
    token = (await register(client, email="s5@example.com"))["access_token"]
    resp = await client.get("/api/v1/companies/ZZZZ", headers=auth_headers(token))
    assert resp.status_code == 200


async def test_analysis_503_when_provider_down_and_no_db(client: AsyncClient, mock_provider):
    mock_provider.set_failure("connection")
    token = (await register(client, email="s6@example.com"))["access_token"]
    resp = await client.get("/api/v1/companies/NODATA", headers=auth_headers(token))
    assert resp.status_code == 503
    assert resp.json()["error"]["code"] == "MARKET_DATA_UNAVAILABLE"
    # No stack trace or internals leaked.
    assert "Traceback" not in resp.text
    assert "apikey" not in resp.text.lower()


async def test_analysis_serves_stale_on_provider_failure(
    client: AsyncClient, mock_provider, db_session
):
    # Mark TCS as stale, then fail the provider -> serve stale DB data.
    from datetime import datetime, timedelta, timezone

    from sqlalchemy import select

    from app.models.company import Company

    res = await db_session.execute(select(Company).where(Company.ticker == "TCS"))
    company = res.scalar_one()
    company.metrics.data_as_of = datetime.now(timezone.utc) - timedelta(hours=2)
    await db_session.commit()

    mock_provider.set_failure("connection")
    token = (await register(client, email="s7@example.com"))["access_token"]
    resp = await client.get("/api/v1/companies/TCS", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["data"]["stale"] is True
    assert resp.json()["data"]["source"] in ("seed", "mock", "fmp")
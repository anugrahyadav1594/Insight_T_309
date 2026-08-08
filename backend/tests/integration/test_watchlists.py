"""Integration tests for watchlist CRUD + enrichment (§24.2)."""

from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import auth_headers, register


async def _token(client: AsyncClient, email: str) -> str:
    return (await register(client, email=email))["access_token"]


async def _watchlist(client: AsyncClient, token: str, name="Watchlist") -> dict:
    resp = await client.post("/api/v1/watchlists", headers=auth_headers(token), json={"name": name})
    assert resp.status_code == 201
    return resp.json()["data"]


async def test_create_list_watchlists(client: AsyncClient):
    token = await _token(client, "w1@example.com")
    await _watchlist(client, token, "Tech")
    await _watchlist(client, token, "Banking")
    resp = await client.get("/api/v1/watchlists", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["data"]["total"] == 2


async def test_add_and_enrich_item(client: AsyncClient):
    token = await _token(client, "w2@example.com")
    watchlist = await _watchlist(client, token)
    wid = watchlist["id"]
    resp = await client.post(f"/api/v1/watchlists/{wid}/items", headers=auth_headers(token),
                             json={"ticker": "TCS"})
    assert resp.status_code == 201
    item = resp.json()["data"]
    assert item["company"]["ticker"] == "TCS"
    assert item["price"] is not None
    assert item["signal"] in ("STRONG_BUY", "BUY", "HOLD", "NEUTRAL", "BEARISH")

    detail = await client.get(f"/api/v1/watchlists/{wid}", headers=auth_headers(token))
    assert detail.status_code == 200
    assert len(detail.json()["data"]["items"]) == 1


async def test_duplicate_item_409(client: AsyncClient):
    token = await _token(client, "w3@example.com")
    watchlist = await _watchlist(client, token)
    wid = watchlist["id"]
    await client.post(f"/api/v1/watchlists/{wid}/items", headers=auth_headers(token), json={"ticker": "INFY"})
    resp = await client.post(f"/api/v1/watchlists/{wid}/items", headers=auth_headers(token),
                             json={"ticker": "INFY"})
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "ITEM_EXISTS"


async def test_remove_item_case_insensitive(client: AsyncClient):
    token = await _token(client, "w4@example.com")
    watchlist = await _watchlist(client, token)
    wid = watchlist["id"]
    await client.post(f"/api/v1/watchlists/{wid}/items", headers=auth_headers(token), json={"ticker": "TCS"})
    resp = await client.delete(f"/api/v1/watchlists/{wid}/items/tcs", headers=auth_headers(token))
    assert resp.status_code == 204
    detail = await client.get(f"/api/v1/watchlists/{wid}", headers=auth_headers(token))
    assert detail.json()["data"]["items"] == []


async def test_remove_missing_item_404(client: AsyncClient):
    token = await _token(client, "w5@example.com")
    watchlist = await _watchlist(client, token)
    resp = await client.delete(f"/api/v1/watchlists/{watchlist['id']}/items/NOPE",
                               headers=auth_headers(token))
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "COMPANY_NOT_FOUND"


async def test_ownership_403(client: AsyncClient):
    token_a = await _token(client, "owner2@example.com")
    token_b = await _token(client, "other2@example.com")
    watchlist = await _watchlist(client, token_a)
    resp = await client.get(f"/api/v1/watchlists/{watchlist['id']}", headers=auth_headers(token_b))
    assert resp.status_code == 403
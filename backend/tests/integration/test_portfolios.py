"""Integration tests for portfolio CRUD + math + ownership (§24.2)."""

from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import auth_headers, register


async def _token(client: AsyncClient, email: str) -> str:
    return (await register(client, email=email))["access_token"]


async def _portfolio(client: AsyncClient, token: str, name="Long-term") -> dict:
    resp = await client.post("/api/v1/portfolios", headers=auth_headers(token),
                             json={"name": name, "description": "test"})
    assert resp.status_code == 201
    return resp.json()["data"]


async def test_create_and_list_portfolios(client: AsyncClient):
    token = await _token(client, "p1@example.com")
    await _portfolio(client, token, "Retirement")
    await _portfolio(client, token, "Growth")
    resp = await client.get("/api/v1/portfolios", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["data"]["total"] == 2


async def test_add_holding_and_math(client: AsyncClient):
    token = await _token(client, "p2@example.com")
    portfolio = await _portfolio(client, token)
    pid = portfolio["id"]
    resp = await client.post(f"/api/v1/portfolios/{pid}/holdings", headers=auth_headers(token),
                             json={"ticker": "TCS", "quantity": 100, "average_buy_price": 3400})
    assert resp.status_code == 201
    holding = resp.json()["data"]
    assert holding["ticker"] == "TCS"
    assert holding["invested_value"] == 340000.0
    assert holding["current_value"] > 0

    # Detail reflects the math.
    detail = await client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers(token))
    assert detail.status_code == 200
    d = detail.json()["data"]
    assert d["summary"]["holdings_count"] == 1
    assert d["summary"]["total_invested"] == 340000.0
    assert len(d["holdings"]) == 1
    assert d["holdings"][0]["overall_score"] is not None


async def test_duplicate_holding_409(client: AsyncClient):
    token = await _token(client, "p3@example.com")
    portfolio = await _portfolio(client, token)
    pid = portfolio["id"]
    body = {"ticker": "INFY", "quantity": 10, "average_buy_price": 1400}
    await client.post(f"/api/v1/portfolios/{pid}/holdings", headers=auth_headers(token), json=body)
    resp = await client.post(f"/api/v1/portfolios/{pid}/holdings", headers=auth_headers(token), json=body)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "HOLDING_EXISTS"


async def test_unknown_company_404(client: AsyncClient):
    token = await _token(client, "p4@example.com")
    portfolio = await _portfolio(client, token)
    resp = await client.post(f"/api/v1/portfolios/{portfolio['id']}/holdings",
                             headers=auth_headers(token),
                             json={"ticker": "NOPE", "quantity": 1, "average_buy_price": 10})
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "COMPANY_NOT_FOUND"


async def test_update_and_delete_holding(client: AsyncClient):
    token = await _token(client, "p5@example.com")
    portfolio = await _portfolio(client, token)
    pid = portfolio["id"]
    add = await client.post(f"/api/v1/portfolios/{pid}/holdings", headers=auth_headers(token),
                            json={"ticker": "TCS", "quantity": 10, "average_buy_price": 3000})
    hid = add.json()["data"]["id"]
    upd = await client.put(f"/api/v1/portfolios/{pid}/holdings/{hid}", headers=auth_headers(token),
                           json={"quantity": 20})
    assert upd.status_code == 200
    assert upd.json()["data"]["quantity"] == 20

    dele = await client.delete(f"/api/v1/portfolios/{pid}/holdings/{hid}", headers=auth_headers(token))
    assert dele.status_code == 204
    detail = await client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers(token))
    assert detail.json()["data"]["summary"]["holdings_count"] == 0


async def test_ownership_403(client: AsyncClient):
    token_a = await _token(client, "owner@example.com")
    token_b = await _token(client, "other@example.com")
    portfolio = await _portfolio(client, token_a)
    # User B cannot access A's portfolio.
    resp = await client.get(f"/api/v1/portfolios/{portfolio['id']}", headers=auth_headers(token_b))
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


async def test_portfolio_not_found_404(client: AsyncClient):
    import uuid

    token = await _token(client, "p6@example.com")
    resp = await client.get(f"/api/v1/portfolios/{uuid.uuid4()}", headers=auth_headers(token))
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "PORTFOLIO_NOT_FOUND"


async def test_portfolio_analyze(client: AsyncClient):
    token = await _token(client, "p7@example.com")
    portfolio = await _portfolio(client, token)
    pid = portfolio["id"]
    await client.post(f"/api/v1/portfolios/{pid}/holdings", headers=auth_headers(token),
                      json={"ticker": "TCS", "quantity": 10, "average_buy_price": 3000})
    resp = await client.post(f"/api/v1/portfolios/{pid}/analyze", headers=auth_headers(token), json={})
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["summary"]
    assert data["disclaimer"] == "Decision support only. Not investment advice."
    assert "overall" in data["scores"]
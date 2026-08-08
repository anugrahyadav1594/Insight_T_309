"""Integration tests for authentication (§24.2)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers, login, register


async def test_register_returns_token_pair(client: AsyncClient):
    data = await register(client, email="alice@example.com")
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 1800
    assert data["user"]["email"] == "alice@example.com"


async def test_register_duplicate_email_409(client: AsyncClient):
    await register(client, email="dup@example.com")
    resp = await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com", "password": "hackathon123", "full_name": "Dup",
    })
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "EMAIL_ALREADY_REGISTERED"


async def test_login_success(client: AsyncClient):
    await register(client, email="bob@example.com")
    data = await login(client, email="bob@example.com")
    assert data["access_token"]


async def test_login_wrong_password_401_generic(client: AsyncClient):
    await register(client, email="carol@example.com")
    resp = await client.post("/api/v1/auth/login", json={
        "email": "carol@example.com", "password": "wrongpass1",
    })
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"
    # No user enumeration: same code for unknown email.
    resp2 = await client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com", "password": "whatever1",
    })
    assert resp2.status_code == 401
    assert resp2.json()["error"]["code"] == "INVALID_CREDENTIALS"


async def test_refresh_rotates_token(client: AsyncClient):
    await register(client, email="dave@example.com")
    data = await login(client, email="dave@example.com")
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": data["refresh_token"]})
    assert resp.status_code == 200
    new_data = resp.json()["data"]
    assert new_data["access_token"]
    assert new_data["refresh_token"] != data["refresh_token"]


async def test_refresh_reuse_detection(client: AsyncClient):
    await register(client, email="erin@example.com")
    data = await login(client, email="erin@example.com")
    # First refresh rotates and revokes the presented token.
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": data["refresh_token"]})
    assert resp.status_code == 200
    # Reusing the revoked token must fail (family-reuse detection).
    resp2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": data["refresh_token"]})
    assert resp2.status_code == 401
    assert resp2.json()["error"]["code"] == "INVALID_REFRESH_TOKEN"


async def test_me(client: AsyncClient):
    data = await register(client, email="frank@example.com")
    resp = await client.get("/api/v1/auth/me", headers=auth_headers(data["access_token"]))
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == "frank@example.com"


async def test_me_missing_token_401(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "TOKEN_MISSING"


async def test_me_invalid_token_401(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers("not.a.token"))
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "TOKEN_INVALID"


async def test_logout(client: AsyncClient):
    data = await register(client, email="grace@example.com")
    resp = await client.post("/api/v1/auth/logout", headers=auth_headers(data["access_token"]),
                             json={"refresh_token": data["refresh_token"]})
    assert resp.status_code == 204
    # The refresh token is now revoked.
    resp2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": data["refresh_token"]})
    assert resp2.status_code == 401


@pytest.mark.integration
async def test_register_validation_422(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "bad", "password": "short", "full_name": "",
    })
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"
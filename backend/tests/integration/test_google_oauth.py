"""Google OAuth tests (offline — Google HTTP calls are mocked)."""

from __future__ import annotations

import os

import pytest
from httpx import AsyncClient

# Force test env (mock provider, no rate limits) — same as conftest.
os.environ.setdefault("MARKET_DATA_PROVIDER", "mock")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("ENVIRONMENT", "test")

from app.core.config import settings  # noqa: E402
from app.services.google_oauth_service import GoogleOAuthService  # noqa: E402
from tests.conftest import auth_headers, register  # noqa: E402

pytestmark = pytest.mark.skipif(
    not (os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET")),
    reason="GOOGLE_CLIENT_ID/SECRET not set; skipping oauth service test",
)


class _FakeGoogle(GoogleOAuthService):
    """Override the HTTP calls to Google with deterministic stubs."""

    async def _exchange_code(self, code: str):
        return {"access_token": "fake-access", "id_token": "fake-id"}

    async def _get_userinfo(self, access_token: str):
        return {
            "sub": "google-user-123",
            "email": "google@example.com",
            "name": "Google Person",
            "email_verified": True,
        }


async def test_find_or_create_user_creates_and_links(client: AsyncClient):
    svc = _FakeGoogle()
    from app.db.session import async_session_factory

    async with async_session_factory() as db:
        info = {"sub": "google-user-123", "email": "google@example.com", "name": "Google Person"}
        user = await svc._find_or_create_user(db, info)
        assert user.email == "google@example.com"
        assert user.password_hash is None  # OAuth-only user has no password
        await db.commit()

    # Google login for the same sub returns the SAME user (no duplicate).
    async with async_session_factory() as db:
        user2 = await svc._find_or_create_user(db, info)
        assert user2.id == user.id
        await db.commit()


async def test_links_existing_email_user(client: AsyncClient):
    # A user already registered with email+password.
    await register(client, email="linkme@example.com", password="hackathon123", full_name="Link Me")

    svc = _FakeGoogle()
    from app.db.session import async_session_factory

    async with async_session_factory() as db:
        info = {"sub": "google-link-456", "email": "linkme@example.com", "name": "Link Me"}
        user = await svc._find_or_create_user(db, info)
        assert user.email == "linkme@example.com"
        # Should be the same user that registered (linked, not duplicated).
        assert user.password_hash is not None
        await db.commit()
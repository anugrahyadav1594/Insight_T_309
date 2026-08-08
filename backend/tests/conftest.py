"""Pytest fixtures.

Sets a test environment (mock providers, rate limiting off). DB-backed fixtures
(``db_engine``, ``db_session``, ``clean_db``, ``client``) are used by the
integration and AI test suites; they are skipped automatically if no PostgreSQL
test database is reachable, so the pure unit suite runs anywhere.

The async engine uses a NullPool in tests, so every test/session uses fresh
per-operation connections and there is no cross-event-loop connection reuse.
"""

from __future__ import annotations

import asyncio
import os

# Must be set BEFORE importing the application so pydantic-settings reads them.
os.environ.setdefault("MARKET_DATA_PROVIDER", "mock")
os.environ.setdefault("LLM_PROVIDER", "local")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-insight-suite-at-least-32-bytes")
os.environ.setdefault(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:55432/insight_test",
)
os.environ.setdefault("DATABASE_URL", os.environ["TEST_DATABASE_URL"])

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker  # noqa: E402

from app.ai.local_provider import LocalProvider  # noqa: E402
from app.api.deps import get_llm, get_provider  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.integrations.market_data.mock_provider import MockMarketDataProvider  # noqa: E402
from app.main import app  # noqa: E402

_USER_TABLES = [
    "screening_results", "screening_queries", "ai_reports", "ai_messages",
    "ai_conversations", "watchlist_items", "watchlists", "portfolio_holdings",
    "portfolios", "refresh_tokens", "users",
]


class MockLLMProvider(LocalProvider):
    """Deterministic mock LLM (same template logic, optional failure injection)."""

    name = "mock"
    model = "mock-llm"

    def __init__(self, fail: bool = False) -> None:
        super().__init__()
        self._fail = fail

    async def generate(self, messages, *, json_mode=False, temperature=None):
        if self._fail:
            raise RuntimeError("mock LLM failure")
        return await super().generate(messages, json_mode=json_mode, temperature=temperature)


# Schema + seed happen once (guarded); all fixtures are otherwise function-scoped.
_db_ready = False


@pytest_asyncio.fixture
async def db_engine():
    """Ensure schema + seed exist (one-time). Skip suite if DB unreachable."""
    global _db_ready
    if not _db_ready:
        try:
            from app.db.seed import seed_database

            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
                await conn.run_sync(Base.metadata.create_all)
            async with async_sessionmaker(bind=engine, expire_on_commit=False)() as session:
                await seed_database(session, create_demo_user=False)
            _db_ready = True
        except Exception as exc:  # noqa: BLE001
            pytest.skip(f"test database unavailable ({exc}); run integration tests in compose")
    yield engine


@pytest_asyncio.fixture
async def db_session(db_engine):
    factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def clean_db(db_session):
    """Reset user-scoped tables before a test; companies seed data is preserved."""
    try:
        for table in _USER_TABLES:
            await db_session.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
        await db_session.commit()
    finally:
        await db_session.rollback()
    yield


@pytest_asyncio.fixture
async def mock_provider():
    return MockMarketDataProvider()


@pytest_asyncio.fixture
async def mock_llm():
    return MockLLMProvider()


@pytest_asyncio.fixture
async def client(db_engine, clean_db, mock_provider, mock_llm):
    async def override_provider():
        return mock_provider

    async def override_llm():
        return mock_llm

    app.dependency_overrides[get_provider] = override_provider
    app.dependency_overrides[get_llm] = override_llm
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
def _dispose_engine_at_end():
    """Dispose the async engine after the whole session."""
    yield
    try:
        loop = asyncio.new_event_loop()
        loop.run_until_complete(engine.dispose())
        loop.close()
    except Exception:  # noqa: BLE001
        pass


# -- helpers ---------------------------------------------------------------------
async def register(client: AsyncClient, email="user@example.com", password="hackathon123",
                   full_name="Test User") -> dict:
    resp = await client.post("/api/v1/auth/register", json={
        "email": email, "password": password, "full_name": full_name,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


async def login(client: AsyncClient, email="user@example.com", password="hackathon123") -> dict:
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
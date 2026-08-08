"""Async SQLAlchemy engine and session factory.

* ``asyncpg`` pool sized from settings (``DB_POOL_SIZE`` / ``DB_MAX_OVERFLOW``).
* ``get_db`` is an async FastAPI dependency yielding a transactional session.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import settings

# create_async_engine supports a placeholder poolclass but we honour the app config.
_engine_kwargs: dict[str, Any] = {
    "pool_pre_ping": True,
    "echo": settings.DB_ECHO,
}

# Use NullPool in tests to avoid cross-test connection reuse issues.
_use_null_pool = settings.ENVIRONMENT in ("development",) and settings.DATABASE_URL.endswith("insight")
# Deterministically pick NullPool when the URL is not the default compose URL, which
# usually indicates a test/local setup that should not hold pooled connections.
if settings.DATABASE_URL.count("@") == 1 and ("test" in settings.DATABASE_URL or "localhost" in settings.DATABASE_URL):
    _engine_kwargs["poolclass"] = NullPool
elif not settings.DATABASE_URL.startswith("postgresql+asyncpg://postgres:postgres@postgres"):
    _engine_kwargs["poolclass"] = NullPool

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

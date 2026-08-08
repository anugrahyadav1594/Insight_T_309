"""Redis cache wrapper with key builders and the TTL registry (ARCHITECTURE.md §20).

Cache reads are the default path; Redis failure degrades gracefully to DB reads
(connection errors are caught and logged, never surfaced as 500s).
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger("insight.cache")


class Cache:
    """Thin async Redis wrapper with graceful-degradation semantics."""

    def __init__(self) -> None:
        self._client: aioredis.Redis | None = None

    @property
    def client(self) -> aioredis.Redis | None:
        if self._client is None:
            try:
                self._client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("failed to create redis client: %s", exc)
                self._client = None
        return self._client

    async def get_json(self, key: str) -> Any | None:
        client = self.client
        if client is None:
            return None
        try:
            raw = await client.get(key)
            return json.loads(raw) if raw else None
        except Exception as exc:
            logger.warning("cache get failed for %s: %s", key, exc)
            return None

    async def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        client = self.client
        if client is None:
            return
        try:
            raw = json.dumps(value, default=str)
            if ttl is not None:
                await client.set(key, raw, ex=ttl)
            else:
                await client.set(key, raw)
        except Exception as exc:
            logger.warning("cache set failed for %s: %s", key, exc)

    async def delete(self, key: str) -> None:
        client = self.client
        if client is None:
            return
        try:
            await client.delete(key)
        except Exception as exc:
            logger.warning("cache delete failed for %s: %s", key, exc)

    async def delete_prefix(self, prefix: str) -> None:
        client = self.client
        if client is None:
            return
        try:
            keys = await client.keys(f"{prefix}*")
            if keys:
                await client.delete(*keys)
        except Exception as exc:
            logger.warning("cache delete_prefix failed for %s: %s", prefix, exc)

    async def ping(self) -> bool:
        client = self.client
        if client is None:
            return False
        try:
            return bool(await client.ping())
        except Exception:
            return False

    async def close(self) -> None:
        if self._client is not None:
            try:
                await self._client.aclose()
            except Exception:
                pass
            self._client = None


cache = Cache()


# ---------------------------------------------------------------------------
# Key builders (§20.1)
# ---------------------------------------------------------------------------
def company_profile_key(ticker: str) -> str:
    return f"company:profile:{ticker.upper()}"


def company_quote_key(ticker: str) -> str:
    return f"company:quote:{ticker.upper()}"


def company_metrics_key(ticker: str) -> str:
    return f"company:metrics:{ticker.upper()}"


def company_statements_key(ticker: str, period: str) -> str:
    return f"company:statements:{ticker.upper()}:{period}"


def company_history_key(ticker: str, period: str) -> str:
    return f"company:history:{ticker.upper()}:{period}"


def company_analysis_key(ticker: str) -> str:
    return f"company:analysis:{ticker.upper()}"


def search_key(query: str, limit: int, exchange: str | None) -> str:
    return f"search:{query.lower()}:{limit}:{exchange or ''}"


def dashboard_key(user_id: str) -> str:
    return f"dashboard:{user_id}"


def screener_key(filter_dict: dict) -> str:
    digest = hashlib.sha256(json.dumps(filter_dict, sort_keys=True, default=str).encode()).hexdigest()[:16]
    return f"screener:{digest}"


def portfolio_analysis_key(user_id: str, portfolio_id: str, payload_hash: str) -> str:
    return f"portfolio:analysis:{user_id}:{portfolio_id}:{payload_hash}"


# TTL registry (seconds)
TTLS = {
    "profile": settings.CACHE_TTL_PROFILE,
    "quote": settings.CACHE_TTL_QUOTE,
    "metrics": settings.CACHE_TTL_METRICS,
    "statements": settings.CACHE_TTL_STATEMENTS,
    "history": settings.CACHE_TTL_HISTORY,
    "analysis": settings.CACHE_TTL_ANALYSIS,
    "search": settings.CACHE_TTL_SEARCH,
    "dashboard": settings.CACHE_TTL_DASHBOARD,
    "screener": settings.CACHE_TTL_SCREENER,
    "portfolio_analysis": settings.CACHE_TTL_PORTFOLIO_ANALYSIS,
}
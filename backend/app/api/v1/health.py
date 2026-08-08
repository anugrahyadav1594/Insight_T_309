"""Health endpoint (§18.2). Reports status, database, redis and provider health
without ever exposing keys or internal URLs."""

from __future__ import annotations

import json
import time

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.db.session import async_session_factory
from app.integrations.market_data.factory import get_market_data_provider
from app.utils.cache import cache

router = APIRouter(tags=["system"])

_START_TIME = time.monotonic()
APP_VERSION = "1.0.0"


@router.get("/health")
async def health() -> Response:
    db_status = await _check_db()
    redis_status = await _check_redis()
    provider_status = await _check_provider()

    degraded = db_status != "ok" or redis_status != "ok"
    payload = {
        "status": "degraded" if degraded else "ok",
        "version": APP_VERSION,
        "database": db_status,
        "redis": redis_status,
        "market_data_provider": provider_status,
        "uptime_s": round(time.monotonic() - _START_TIME, 1),
    }
    return Response(
        content=json.dumps(payload),
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE if degraded else status.HTTP_200_OK,
        media_type="application/json",
    )


async def _check_db() -> str:
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        return "ok"
    except Exception:
        return "unavailable"


async def _check_redis() -> str:
    ok = await cache.ping()
    return "ok" if ok else "unavailable"


async def _check_provider() -> str:
    try:
        provider = get_market_data_provider()
        health = await provider.health_check()
        return health.status
    except Exception:
        return "unavailable"
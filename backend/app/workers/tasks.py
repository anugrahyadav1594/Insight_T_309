"""Background task definitions (ARCHITECTURE.md §21.3).

Each task is a standalone async callable that opens its own DB session and
builds its own providers, so it can run after the request context is gone
(FastAPI BackgroundTasks) or on a worker later.
"""

from __future__ import annotations

import logging
from typing import Callable, Any

from app.integrations.market_data.factory import get_market_data_provider

logger = logging.getLogger("insight.workers")


async def refresh_company_data(ticker: str) -> dict[str, Any]:
    """Refresh a company's market data + scores in the background."""
    from app.db.session import async_session_factory
    from app.services.market_data_service import market_data_service

    provider = get_market_data_provider()
    async with async_session_factory() as db:
        try:
            return await market_data_service.refresh_company_data(db, provider, ticker)
        except Exception as exc:  # noqa: BLE001 - background tasks must not raise out
            logger.exception("background refresh failed for %s", ticker)
            return {"ticker": ticker, "error": str(exc)}


TASK_REGISTRY: dict[str, Callable[..., Any]] = {
    "refresh_company_data": refresh_company_data,
}


def get_task(name: str) -> Callable[..., Any] | None:
    return TASK_REGISTRY.get(name)
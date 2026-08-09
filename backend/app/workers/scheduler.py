"""Scheduled auto-refresh worker (ARCHITECTURE.md §21, §29).

A long-running asyncio background task that periodically pulls fresh live market
data (Yahoo/FMP) for every enabled company and recomputes scores. It runs inside
the FastAPI process via a task started in ``lifespan``. It is a lightweight
stand-in for a Phase-2 Celery beat scheduler but works for a single deployed
instance.

Behavior:
* Runs every ``AUTO_REFRESH_INTERVAL_SECONDS``.
* Iterates all enabled companies, refreshing those that are stale (> quote TTL)
  or (when ``AUTO_REFRESH_FORCE_SEEDED``) those never synced from a provider.
* Degrades gracefully: a failure for one company is logged and skipped, never
  crashing the loop.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.core.config import settings

logger = logging.getLogger("insight.scheduler")


async def _refresh_universe() -> None:
    from app.repositories import company_repository
    from app.services.market_data_service import market_data_service
    from app.integrations.market_data.factory import get_market_data_provider

    provider = get_market_data_provider()
    from app.db.session import async_session_factory

    async with async_session_factory() as db:
        companies = await company_repository.get_all(db)
        refreshed = 0
        skipped = 0
        for company in companies:
            metrics = company.metrics
            stale = True
            if metrics is not None:
                age = (datetime.now(timezone.utc) - metrics.data_as_of).total_seconds()
                stale = age >= settings.QUOTE_STALE_AFTER_SECONDS
                # Force refresh of seeded (never-synced) companies so they get real data.
                if settings.AUTO_REFRESH_FORCE_SEEDED and company.data_status == "seeded":
                    stale = True
            if not stale:
                skipped += 1
                continue
            try:
                await market_data_service.refresh_company_data(db, provider, company.ticker)
                refreshed += 1
            except Exception as exc:  # noqa: BLE001 - keep the loop alive
                logger.warning("scheduled refresh failed for %s: %s", company.ticker, exc)
        logger.info(
            "scheduler pass complete: %d refreshed, %d skipped (provider=%s)",
            refreshed, skipped, provider.name,
        )


async def scheduler_loop() -> None:
    """Run refresh passes forever (started in FastAPI lifespan)."""
    interval = max(settings.AUTO_REFRESH_INTERVAL_SECONDS, 60)
    logger.info("auto-refresh scheduler started (interval=%ss)", interval)
    while True:
        try:
            await _refresh_universe()
        except asyncio.CancelledError:
            logger.info("scheduler cancelled")
            raise
        except Exception as exc:  # noqa: BLE001 - never crash the loop
            logger.exception("scheduler pass error: %s", exc)
        await asyncio.sleep(interval)


def _scheduler_task() -> asyncio.Task | None:
    """Create the scheduler task if enabled, else None."""
    if not settings.AUTO_REFRESH_ENABLED:
        return None
    return asyncio.create_task(scheduler_loop())
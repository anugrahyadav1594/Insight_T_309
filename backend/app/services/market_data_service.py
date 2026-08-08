"""Market-data service facade — cache → DB → provider (ARCHITECTURE.md §6.5).

Services depend on this facade only. It maps provider failures to
``MARKET_DATA_UNAVAILABLE`` (503) when no data exists, or serves the last-known
DB values with ``stale=True`` when a company already has data (degradation rule
§29.8).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import MarketDataUnavailableError
from app.integrations.market_data.base import BaseMarketDataProvider
from app.integrations.market_data.exceptions import MarketDataProviderError
from app.models.company import Company, CompanyMetrics, CompanyPrice, FinancialStatement
from app.repositories import company_repository
from app.services import refresh_service
from app.utils import cache as cache_util

logger = logging.getLogger("insight.market_data")


@dataclass
class SnapshotBundle:
    """A company's persisted raw snapshot (identity + metrics + history)."""

    company: Company
    metrics: CompanyMetrics
    prices: list[CompanyPrice]
    statements: list[FinancialStatement]
    data_as_of: datetime
    source: str
    stale: bool = False


def _bundle(
    company: Company,
    metrics: CompanyMetrics,
    stale: bool,
) -> SnapshotBundle:
    return SnapshotBundle(
        company=company,
        metrics=metrics,
        prices=list(company.prices),
        statements=list(company.statements),
        data_as_of=metrics.data_as_of,
        source=metrics.source,
        stale=stale,
    )


def _is_fresh(data_as_of: datetime) -> bool:
    age = (datetime.now(timezone.utc) - data_as_of).total_seconds()
    return age < settings.QUOTE_STALE_AFTER_SECONDS


class MarketDataService:
    """Facade over the provider + cache + DB for market data reads."""

    async def get_company_snapshot(
        self,
        db: AsyncSession,
        provider: BaseMarketDataProvider,
        ticker: str,
        *,
        force_refresh: bool = False,
    ) -> SnapshotBundle:
        ticker = ticker.upper()

        # Cache-first: serve the cached metrics snapshot if it looks fresh.
        if not force_refresh:
            cached = await self._try_cache_snapshot(db, ticker)
            if cached is not None:
                return cached

        company = await company_repository.get_company_by_ticker(db, ticker)

        # DB-second: fresh persisted data.
        if company is not None and company.metrics is not None and not force_refresh:
            if _is_fresh(company.metrics.data_as_of):
                return _bundle(company, company.metrics, stale=False)

        # Provider-last: refresh.
        try:
            await refresh_service.refresh_company_data(db, provider, ticker)
        except MarketDataProviderError as exc:
            if company is not None and company.metrics is not None:
                logger.warning("provider failed for %s; serving stale DB data", ticker)
                return _bundle(company, company.metrics, stale=True)
            logger.warning("provider failed for %s and no DB data exists", ticker)
            raise MarketDataUnavailableError() from exc

        company = await company_repository.get_company_by_ticker(db, ticker)
        if company is None or company.metrics is None:
            raise MarketDataUnavailableError()
        return _bundle(company, company.metrics, stale=False)

    async def refresh_company_data(
        self, db: AsyncSession, provider: BaseMarketDataProvider, ticker: str
    ) -> dict[str, Any]:
        """Public refresh entry point (also exposed as a background task)."""
        return await refresh_service.refresh_company_data(db, provider, ticker)

    async def _try_cache_snapshot(
        self, db: AsyncSession, ticker: str
    ) -> SnapshotBundle | None:
        """Try to reconstruct a bundle from the cached metrics snapshot."""
        row = await cache_util.cache.get_json(cache_util.company_metrics_key(ticker))
        if not row:
            return None
        company = await company_repository.get_company_by_ticker(db, ticker)
        if company is None or company.metrics is None:
            return None
        return _bundle(company, company.metrics, stale=False)


market_data_service = MarketDataService()
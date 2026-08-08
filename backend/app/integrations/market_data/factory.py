"""Market-data provider factory (ARCHITECTURE.md §6.6).

Reads ``MARKET_DATA_PROVIDER`` and returns the configured provider. Swapping
providers is a one-env-var change.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.integrations.market_data.base import BaseMarketDataProvider


@lru_cache
def get_market_data_provider() -> BaseMarketDataProvider:
    """Build the configured market-data provider."""
    from app.integrations.market_data.fmp_provider import FMPMarketDataProvider
    from app.integrations.market_data.mock_provider import MockMarketDataProvider
    from app.integrations.market_data.yahoo_provider import YahooFinanceProvider

    provider_name = settings.MARKET_DATA_PROVIDER
    if provider_name == "mock":
        return MockMarketDataProvider()
    if provider_name == "yahoo":
        return YahooFinanceProvider()
    if provider_name == "fmp":
        if not settings.FMP_API_KEY and settings.REQUIRE_FMP_KEY:
            raise RuntimeError(
                "FMP_API_KEY is not configured but MARKET_DATA_PROVIDER=fmp. "
                "Set the key or switch to MARKET_DATA_PROVIDER=mock."
            )
        return FMPMarketDataProvider()
    raise RuntimeError(f"Unknown MARKET_DATA_PROVIDER: {provider_name}")
"""Provider-agnostic market data interface (ARCHITECTURE.md §6.2).

The application depends ONLY on this abstract interface. FMP, Mock and any
future provider implement it; services never know which provider is in use.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.integrations.market_data.schemas import (
    NormalizedCompanyProfile,
    NormalizedFinancialStatements,
    NormalizedMetrics,
    NormalizedPriceBar,
    NormalizedQuote,
    NormalizedSearchHit,
    ProviderHealth,
)


class BaseMarketDataProvider(ABC):
    """Abstract market-data provider."""

    name: str = "base"

    @abstractmethod
    async def get_profile(self, ticker: str) -> NormalizedCompanyProfile:
        """Return the normalized company profile/identity."""

    @abstractmethod
    async def get_quote(self, ticker: str) -> NormalizedQuote:
        """Return the normalized latest quote."""

    @abstractmethod
    async def get_metrics(self, ticker: str) -> NormalizedMetrics:
        """Return the normalized key-metrics snapshot."""

    @abstractmethod
    async def get_financial_statements(
        self, ticker: str, period: str = "annual", limit: int = 5
    ) -> list[NormalizedFinancialStatements]:
        """Return normalized financial statements."""

    @abstractmethod
    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[NormalizedPriceBar]:
        """Return normalized daily price history."""

    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> list[NormalizedSearchHit]:
        """Search companies (server-side; used by refresh/pipeline, not per-keystroke)."""

    @abstractmethod
    async def health_check(self) -> ProviderHealth:
        """Return provider health status (never exposes keys/URLs)."""
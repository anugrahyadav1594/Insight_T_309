"""Typed exceptions raised by the FMP market-data provider (ARCHITECTURE.md §29.5).

These are FMP-specific and are caught in ``market_data_service`` and mapped to
application errors (e.g. :class:`app.core.exceptions.MarketDataUnavailableError`).
They are never exposed to the frontend.
"""

from __future__ import annotations


class MarketDataProviderError(Exception):
    """Base error for all provider failures."""


class FMPAuthenticationError(MarketDataProviderError):
    """FMP returned 401/403 (bad or missing API key)."""


class FMPRateLimitError(MarketDataProviderError):
    """FMP returned 429 (rate limit / quota exhausted)."""

    def __init__(self, message: str = "FMP rate limit exceeded", retry_after: float | None = None):
        super().__init__(message)
        self.retry_after = retry_after


class FMPTimeoutError(MarketDataProviderError):
    """Request to FMP timed out."""


class FMPConnectionError(MarketDataProviderError):
    """Could not connect to FMP (DNS/transport failure)."""


class FMPInvalidResponseError(MarketDataProviderError):
    """FMP returned data that failed schema validation."""


class FMPDataUnavailableError(MarketDataProviderError):
    """FMP returned no data for the requested symbol (404 / empty payload)."""
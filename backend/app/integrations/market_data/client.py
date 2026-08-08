"""Async FMP HTTP client (ARCHITECTURE.md §29).

Owns the base URL + API-key injection, timeouts, retries with backoff and
mapping of transport errors to typed exceptions. The FMP API key exists only
here (from settings) and is never logged or returned.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.integrations.market_data.exceptions import (
    FMPAuthenticationError,
    FMPConnectionError,
    FMPDataUnavailableError,
    FMPInvalidResponseError,
    FMPRateLimitError,
    FMPTimeoutError,
)

logger = logging.getLogger("insight.fmp")


class FMPClient:
    """Thin async client for the Financial Modeling Prep REST API."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        timeout_seconds: float | None = None,
        max_retries: int | None = None,
    ) -> None:
        self.base_url = (base_url or settings.FMP_BASE_URL).rstrip("/")
        self.api_key = api_key if api_key is not None else settings.FMP_API_KEY
        self.timeout = timeout_seconds or settings.FMP_TIMEOUT_SECONDS
        self.max_retries = max_retries if max_retries is not None else settings.FMP_MAX_RETRIES

    async def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        """Perform a GET and return parsed JSON, with retries and error mapping."""
        query = {**(params or {}), "apikey": self.api_key}
        url = f"{self.base_url}{path}"
        attempt = 0
        while True:
            try:
                async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                    resp = await client.get(url, params=query)
                return self._handle_response(resp)
            except (httpx.TimeoutException, asyncio.TimeoutError) as exc:
                attempt += 1
                if attempt > self.max_retries:
                    raise FMPTimeoutError(f"FMP request timed out after {attempt} attempts") from exc
                await self._backoff(attempt)
            except httpx.HTTPStatusError as exc:
                raise self._map_status(exc.response) from exc
            except httpx.HTTPError as exc:
                attempt += 1
                if attempt > self.max_retries:
                    raise FMPConnectionError(f"FMP connection error: {exc}") from exc
                await self._backoff(attempt)

    def _handle_response(self, resp: httpx.Response) -> Any:
        if resp.status_code in (401, 403):
            raise FMPAuthenticationError(f"FMP authentication failed (HTTP {resp.status_code})")
        if resp.status_code == 429:
            retry_after = resp.headers.get("Retry-After")
            raise FMPRateLimitError(retry_after=float(retry_after) if retry_after else None)
        if resp.status_code == 404:
            raise FMPDataUnavailableError("FMP returned 404 for the requested data")
        if resp.status_code >= 500:
            raise FMPConnectionError(f"FMP server error (HTTP {resp.status_code})")
        if resp.status_code != 200:
            raise FMPInvalidResponseError(f"Unexpected FMP status {resp.status_code}")

        try:
            data = resp.json()
        except ValueError as exc:
            raise FMPInvalidResponseError("FMP returned malformed JSON") from exc

        # FMP wraps errors as a JSON object with an "Error Message" key.
        if isinstance(data, dict) and ("Error Message" in data or "error" in data):
            raise FMPDataUnavailableError(str(data))
        return data

    @staticmethod
    def _map_status(resp: httpx.Response) -> Exception:
        if resp.status_code in (401, 403):
            return FMPAuthenticationError(f"FMP authentication failed (HTTP {resp.status_code})")
        if resp.status_code == 429:
            return FMPRateLimitError()
        if resp.status_code == 404:
            return FMPDataUnavailableError("FMP returned 404")
        return FMPConnectionError(f"FMP request failed (HTTP {resp.status_code})")

    @staticmethod
    async def _backoff(attempt: int) -> None:
        await asyncio.sleep(0.5 * (2 ** (attempt - 1)))
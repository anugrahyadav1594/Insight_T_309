"""Yahoo Finance market-data provider — free, no API key, good Indian (NSE/BSE) coverage.

Uses Yahoo's public JSON endpoints for:
* Real-time quotes + daily OHLCV history  -> ``/v8/finance/chart`` (no auth)
* Fundamentals (P/E, ROE, margins, ratios) -> ``/v10/finance/quoteSummary`` (needs a
  session cookie + crumb, handled internally via an httpx client that keeps cookies)

Tickers use Yahoo's suffix conventions: ``TCS.NS`` (NSE), ``TCS.BO`` (BSE).
US symbols pass through as-is.

Limitations (documented in docs/ADR.md):
* Yahoo's balance-sheet module is null for many Indian tickers, so debt/equity and
  total-equity-derived ROE are unavailable; ROE comes from ``financialData`` instead.
  Missing fundamentals fall back to neutral 50 in the scoring engines.
* Yahoo may rate-limit (429) or require re-crumb; the client re-crumbs per request
  and the refresh path degrades to seed data on failure.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

import httpx

from app.core.config import settings
from app.integrations.market_data.base import BaseMarketDataProvider
from app.integrations.market_data.exceptions import (
    FMPDataUnavailableError,
    FMPInvalidResponseError,
)
from app.integrations.market_data.schemas import (
    NormalizedCompanyProfile,
    NormalizedFinancialStatements,
    NormalizedMetrics,
    NormalizedPriceBar,
    NormalizedQuote,
    NormalizedSearchHit,
    ProviderHealth,
)

logger = logging.getLogger("insight.market_data")

QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart"
SUMMARY_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def _nse_suffix(ticker: str) -> str:
    """Append Yahoo's NSE suffix if the ticker isn't already suffixed."""
    t = ticker.upper()
    return t if "." in t else f"{t}.NS"


def _app_ticker(symbol: str) -> str:
    """Strip Yahoo's exchange suffix (.NS/.BO) to return the app-level ticker."""
    return symbol.upper().split(".")[0]


def _num(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


def _raw(obj: dict[str, Any], key: str) -> Any:
    """Yahoo wraps numeric fields as ``{"raw":..., "fmt":...}``."""
    v = obj.get(key)
    if isinstance(v, dict):
        return v.get("raw")
    return v


class YahooSession:
    """Keeps a cookie jar + fresh crumb for Yahoo's authenticated endpoints."""

    def __init__(self, timeout: float | None = None) -> None:
        self._timeout = timeout or settings.FMP_TIMEOUT_SECONDS
        self._client: httpx.AsyncClient | None = None
        self._crumb: str | None = None

    async def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                headers={"User-Agent": USER_AGENT},
                follow_redirects=True,
            )
        return self._client

    async def crumb(self) -> str:
        if self._crumb:
            return self._crumb
        c = await self.client()
        # Get an A3 session cookie, then a crumb token.
        try:
            await c.get("https://fc.yahoo.com")
            resp = await c.get("https://query1.finance.yahoo.com/v1/test/getcrumb")
            self._crumb = resp.text.strip()
        except Exception as exc:  # noqa: BLE001
            raise FMPDataUnavailableError(f"yahoo crumb fetch failed: {exc}") from exc
        if not self._crumb:
            raise FMPDataUnavailableError("yahoo returned empty crumb")
        return self._crumb

    async def get_summary(self, symbol: str, modules: str) -> dict[str, Any]:
        c = await self.client()
        crumb = await self.crumb()
        url = f"{SUMMARY_URL}/{symbol}"
        params = {"modules": modules, "crumb": crumb}
        try:
            resp = await c.get(url, params=params)
        except Exception as exc:  # noqa: BLE001
            raise FMPDataUnavailableError(f"yahoo summary error: {exc}") from exc
        if resp.status_code != 200:
            raise FMPDataUnavailableError(f"yahoo summary HTTP {resp.status_code}")
        try:
            data = resp.json()
        except Exception as exc:  # noqa: BLE001
            raise FMPInvalidResponseError("yahoo summary malformed JSON") from exc
        try:
            return data["quoteSummary"]["result"][0]
        except (KeyError, IndexError, TypeError):
            raise FMPDataUnavailableError("yahoo summary returned no result") from None

    async def aclose(self) -> None:
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()


class YahooFinanceProvider(BaseMarketDataProvider):
    """Free provider backed by Yahoo Finance."""

    name = "yahoo"

    def __init__(self) -> None:
        self._session = YahooSession()

    async def _chart(self, ticker: str, range_: str = "1y", interval: str = "1d") -> dict[str, Any]:
        symbol = _nse_suffix(ticker)
        url = f"{QUOTE_URL}/{symbol}"
        params = {"range": range_, "interval": interval}
        headers = {"User-Agent": USER_AGENT}
        try:
            async with httpx.AsyncClient(timeout=settings.FMP_TIMEOUT_SECONDS, headers=headers) as client:
                resp = await client.get(url, params=params)
        except Exception as exc:  # noqa: BLE001
            raise FMPDataUnavailableError(f"yahoo connection error: {exc}") from exc
        if resp.status_code in (401, 403):
            raise FMPDataUnavailableError(f"yahoo access error (HTTP {resp.status_code})")
        if resp.status_code == 429:
            raise FMPDataUnavailableError("yahoo rate limited (HTTP 429)")
        if resp.status_code != 200:
            raise FMPDataUnavailableError(f"yahoo HTTP {resp.status_code}")
        try:
            data = resp.json()
        except Exception as exc:  # noqa: BLE001
            raise FMPInvalidResponseError("yahoo returned malformed JSON") from exc
        try:
            return data["chart"]["result"][0]
        except (KeyError, IndexError, TypeError):
            raise FMPDataUnavailableError("yahoo returned no chart data") from None

    # -- profile ---------------------------------------------------------------
    async def get_profile(self, ticker: str) -> NormalizedCompanyProfile:
        meta = (await self._chart(ticker, range_="1mo"))["meta"]
        return NormalizedCompanyProfile(
            ticker=_app_ticker(_nse_suffix(ticker)),
            name=meta.get("longName") or meta.get("shortName") or ticker,
            exchange=(meta.get("fullExchangeName") or "NSE")[:16],
            sector=None,
            industry=None,
            description=None,
            currency=meta.get("currency") or "INR",
            country="India",
        )

    # -- quote ------------------------------------------------------------------
    async def get_quote(self, ticker: str) -> NormalizedQuote:
        meta = (await self._chart(ticker, range_="1mo"))["meta"]
        try:
            ts = datetime.fromtimestamp(meta["regularMarketTime"], tz=timezone.utc)
        except (KeyError, ValueError, OSError):
            ts = datetime.now(timezone.utc)
        return NormalizedQuote(
            ticker=_app_ticker(_nse_suffix(ticker)),
            price=_num(meta.get("regularMarketPrice")) or Decimal("0"),
            previous_close=_num(meta.get("chartPreviousClose")),
            day_change=None,
            day_change_pct=None,
            volume=_num_to_int(meta.get("regularMarketVolume")),
            avg_volume=None,
            market_cap=None,
            high_52w=_num(meta.get("fiftyTwoWeekHigh")),
            low_52w=_num(meta.get("fiftyTwoWeekLow")),
            data_as_of=ts,
        )

    # -- metrics (fundamentals via quoteSummary) ----------------------------------
    async def get_metrics(self, ticker: str) -> NormalizedMetrics:
        symbol = _nse_suffix(ticker)
        r = await self._session.get_summary(
            symbol,
            "summaryDetail,defaultKeyStatistics,financialData,incomeStatementHistory",
        )
        sd = r.get("summaryDetail", {})
        dk = r.get("defaultKeyStatistics", {})
        fd = r.get("financialData", {})

        metrics = NormalizedMetrics(
            ticker=_app_ticker(symbol),
            pe_ratio=_num(_raw(sd, "trailingPE")) or _num(_raw(sd, "peRatio")),
            pb_ratio=_num(_raw(dk, "priceToBook")),
            ps_ratio=_num(_raw(dk, "priceToSalesTrailing12Months")),
            ev_ebitda=_num(_raw(dk, "enterpriseToEbitda")),
            roe=_pct(_raw(fd, "returnOnEquity")),
            gross_margin=_pct(_raw(fd, "grossMargins")),
            operating_margin=_pct(_raw(fd, "operatingMargins")),
            net_margin=_pct(_raw(fd, "profitMargins")),
            current_ratio=_num(_raw(fd, "currentRatio")),
            free_cash_flow=_num(_raw(fd, "freeCashflow")),
            dividend_yield=_pct(_raw(sd, "dividendYield")),
            beta=_num(_raw(dk, "beta")),
            eps=_num(_raw(dk, "trailingEps")),
            revenue=_num(_raw(fd, "totalRevenue")) or self._income_revenue(r),
            net_income=_num(_raw(dk, "netIncomeToCommon")) or self._income_net_income(r),
            market_cap=_num(_raw(sd, "marketCap")),
            data_as_of=datetime.now(timezone.utc),
        )

        # Revenue / EPS growth from income statement history (formulas).
        growth = self._income_growth(r)
        metrics.revenue_growth = growth.get("revenue_growth")
        metrics.eps_growth = growth.get("eps_growth")
        return metrics

    @staticmethod
    def _income_revenue(r: dict[str, Any]) -> Decimal | None:
        rows = r.get("incomeStatementHistory", {}).get("incomeStatementHistory", [])
        return _num(_raw(rows[0], "totalRevenue")) if rows else None

    @staticmethod
    def _income_net_income(r: dict[str, Any]) -> Decimal | None:
        rows = r.get("incomeStatementHistory", {}).get("incomeStatementHistory", [])
        return _num(_raw(rows[0], "netIncome")) if rows else None

    @staticmethod
    def _income_growth(r: dict[str, Any]) -> dict[str, Decimal | None]:
        rows = r.get("incomeStatementHistory", {}).get("incomeStatementHistory", [])
        result: dict[str, Decimal | None] = {"revenue_growth": None, "eps_growth": None}
        if len(rows) < 2:
            return result
        def growth(key: str) -> Decimal | None:
            newer = _raw(rows[0], key)
            older = _raw(rows[1], key)
            if not newer or not older or float(older) == 0:
                return None
            return Decimal(str((float(newer) - float(older)) / abs(float(older)) * 100.0))
        result["revenue_growth"] = growth("totalRevenue")
        result["eps_growth"] = growth("dilutedEPS") or growth("dilutedEPS")
        return result

    async def get_financial_statements(
        self, ticker: str, period: str = "annual", limit: int = 5
    ) -> list[NormalizedFinancialStatements]:
        symbol = _nse_suffix(ticker)
        r = await self._session.get_summary(symbol, "incomeStatementHistory")
        rows = r.get("incomeStatementHistory", {}).get("incomeStatementHistory", [])
        statements: list[NormalizedFinancialStatements] = []
        for row in rows[:limit]:
            end = row.get("endDate", {})
            fiscal_year = None
            if isinstance(end, dict):
                raw = end.get("raw")
                if raw:
                    try:
                        fiscal_year = datetime.fromtimestamp(raw, tz=timezone.utc).year
                    except (ValueError, OSError):
                        fiscal_year = None
            if fiscal_year is None:
                continue
            statements.append(
                NormalizedFinancialStatements(
                    ticker=_app_ticker(symbol),
                    period_type=period,
                    fiscal_year=fiscal_year,
                    revenue=_num(_raw(row, "totalRevenue")),
                    gross_profit=_num(_raw(row, "grossProfit")),
                    operating_income=_num(_raw(row, "operatingIncome")),
                    net_income=_num(_raw(row, "netIncome")),
                    eps=_num(_raw(row, "dilutedEPS")) or _num(_raw(row, "eps")),
                )
            )
        return statements

    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[NormalizedPriceBar]:
        result = await self._chart(ticker, range_="1y", interval="1d")
        meta = result.get("meta", {})
        symbol = _app_ticker(meta.get("symbol") or _nse_suffix(ticker))
        timestamps = result.get("timestamp") or []
        quote = result.get("indicators", {}).get("quote", [{}])[0] or {}
        opens = quote.get("open") or []
        highs = quote.get("high") or []
        lows = quote.get("low") or []
        closes = quote.get("close") or []
        volumes = quote.get("volume") or []

        bars: list[NormalizedPriceBar] = []
        for i, ts in enumerate(timestamps):
            try:
                d = date.fromtimestamp(ts)
                close = closes[i] if i < len(closes) else None
                if close is None:
                    continue
                bars.append(
                    NormalizedPriceBar(
                        ticker=symbol,
                        trade_date=d,
                        open=_num(opens[i]) if i < len(opens) and opens[i] is not None else _num(close),
                        high=_num(highs[i]) if i < len(highs) and highs[i] is not None else _num(close),
                        low=_num(lows[i]) if i < len(lows) and lows[i] is not None else _num(close),
                        close=_num(close),
                        volume=_num_to_int(volumes[i]) if i < len(volumes) else 0,
                    )
                )
            except (ValueError, TypeError, IndexError):
                continue
        return bars

    async def search(self, query: str, limit: int = 10) -> list[NormalizedSearchHit]:
        # The app uses local DB search for the search feature (§7); no provider call.
        return []

    async def health_check(self) -> ProviderHealth:
        try:
            await self._chart("TCS.NS", range_="1mo")
            return ProviderHealth(status="available")
        except Exception:  # noqa: BLE001
            return ProviderHealth(status="unavailable")

    async def aclose(self) -> None:
        await self._session.aclose()


def _num_to_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(float(str(value)))
    except (ValueError, TypeError):
        return None


def _pct(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return (Decimal(str(value)) * 100).quantize(Decimal("0.0001"))
    except (ValueError, TypeError, AttributeError):
        return None
"""Financial Modeling Prep (FMP) market-data provider.

This file (and ``client.py``) are the ONLY place the app knows FMP exists
(ARCHITECTURE.md §29). FMP JSON is mapped here to the normalized internal
schemas, then validated with Pydantic before it can reach the database.

Endpoint availability depends on the purchased FMP plan; mappings are defensive
(``None`` when a field is absent).

NOTE (2026): FMP retired the legacy ``/api/v3/...`` endpoints (Aug 2025). The
current API uses the ``/stable/...`` base path with ``?symbol=`` query params.
This provider targets the stable API. The free ("Starter") plan is US-centric;
Indian (NSE/BSE) tickers may not return data on the free tier — the refresh path
degrades gracefully to seed data in that case (see docs/ADR.md).
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from pydantic import ValidationError

from app.integrations.market_data.base import BaseMarketDataProvider
from app.integrations.market_data.client import FMPClient
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


def _num(obj: dict[str, Any], key: str) -> Decimal | None:
    val = obj.get(key)
    if val is None:
        return None
    try:
        return Decimal(str(val))
    except (ValueError, TypeError, AttributeError):
        return None


def _pct(obj: dict[str, Any], key: str) -> Decimal | None:
    """Convert a fractional FMP value (e.g. 0.274) to a percentage (27.4)."""
    val = _num(obj, key)
    if val is None:
        return None
    return (val * 100).quantize(Decimal("0.0001"))


def _int(obj: dict[str, Any], key: str) -> int | None:
    val = obj.get(key)
    if val is None:
        return None
    try:
        return int(float(str(val)))
    except (ValueError, TypeError):
        return None


class FMPMarketDataProvider(BaseMarketDataProvider):
    """Primary provider backed by the FMP stable REST API."""

    name = "fmp"

    def __init__(self, client: FMPClient | None = None) -> None:
        self._client = client or FMPClient()

    # -- profile ---------------------------------------------------------------
    async def get_profile(self, ticker: str) -> NormalizedCompanyProfile:
        data = await self._client.get("/stable/profile", {"symbol": ticker.upper()})
        row = self._first(data)
        try:
            return NormalizedCompanyProfile(
                ticker=row.get("symbol") or ticker,
                name=row.get("companyName") or ticker,
                exchange=row.get("exchange") or "NSE",
                sector=row.get("sector"),
                industry=row.get("industry"),
                description=row.get("description"),
                currency=row.get("currency") or "INR",
                country=row.get("country"),
            )
        except ValidationError as exc:
            raise FMPInvalidResponseError(f"Invalid profile payload: {exc}") from exc

    # -- quote ------------------------------------------------------------------
    async def get_quote(self, ticker: str) -> NormalizedQuote:
        data = await self._client.get("/stable/quote", {"symbol": ticker.upper()})
        row = self._first(data)
        try:
            return NormalizedQuote(
                ticker=row.get("symbol") or ticker,
                price=_num(row, "price") or Decimal("0"),
                previous_close=_num(row, "previousClose"),
                day_change=_num(row, "change"),
                day_change_pct=_num(row, "changesPercentage"),
                volume=_int(row, "volume"),
                avg_volume=_int(row, "avgVolume") or _int(row, "averageVolume"),
                market_cap=_num(row, "marketCap"),
                high_52w=_num(row, "yearHigh"),
                low_52w=_num(row, "yearLow"),
                data_as_of=datetime.now(timezone.utc),
            )
        except ValidationError as exc:
            raise FMPInvalidResponseError(f"Invalid quote payload: {exc}") from exc

    # -- metrics ----------------------------------------------------------------
    async def get_metrics(self, ticker: str) -> NormalizedMetrics:
        ratios = await self._client.get(
            "/stable/ratios", {"symbol": ticker.upper(), "period": "annual", "limit": 5}
        )
        row = self._first(ratios)
        try:
            metrics = NormalizedMetrics(
                ticker=ticker,
                pe_ratio=_num(row, "priceEarningsRatioTTM") or _num(row, "peRatioTTM"),
                pb_ratio=_num(row, "priceToBookRatioTTM"),
                ps_ratio=_num(row, "priceToSalesRatioTTM"),
                ev_ebitda=_num(row, "enterpriseValueOverEBITDA"),
                roe=_pct(row, "returnOnEquityTTM"),
                roa=_pct(row, "returnOnAssetsTTM"),
                gross_margin=_pct(row, "grossProfitMarginTTM"),
                operating_margin=_pct(row, "operatingProfitMarginTTM"),
                net_margin=_pct(row, "netProfitMarginTTM"),
                debt_to_equity=_num(row, "debtToEquityTTM"),
                current_ratio=_num(row, "currentRatioTTM"),
                dividend_yield=_pct(row, "dividendYieldTTM"),
                beta=_num(row, "beta"),
                data_as_of=datetime.now(timezone.utc),
            )
        except ValidationError as exc:
            raise FMPInvalidResponseError(f"Invalid ratios payload: {exc}") from exc
        await self._merge_key_metrics(ticker, metrics)
        return metrics

    async def _merge_key_metrics(self, ticker: str, metrics: NormalizedMetrics) -> None:
        try:
            data = await self._client.get(
                "/stable/key-metrics", {"symbol": ticker.upper(), "period": "annual", "limit": 5}
            )
        except Exception:  # key-metrics is optional on some plans — degrade gracefully.
            return
        row = self._first(data)
        if not row:
            return
        fields = {
            "revenue": ("revenuePerShareTTM", False),
            "revenue_growth": ("revenueGrowthTTM", True),
            "eps_growth": ("netIncomeGrowthTTM", True),
            "free_cash_flow": ("freeCashFlowPerShareTTM", False),
            "volatility_30d": ("volatility", False),
        }
        for attr, (key, is_pct) in fields.items():
            if getattr(metrics, attr, None) is None and row.get(key) is not None:
                val = _pct(row, key) if is_pct else _num(row, key)
                if val is not None:
                    object.__setattr__(metrics, attr, val)

    # -- financial statements ---------------------------------------------------
    async def get_financial_statements(
        self, ticker: str, period: str = "annual", limit: int = 5
    ) -> list[NormalizedFinancialStatements]:
        params = {"symbol": ticker.upper(), "period": period, "limit": limit}
        income = await self._client.get("/stable/income-statement", params)
        try:
            balance = await self._client.get("/stable/balance-sheet-statement", params)
        except FMPDataUnavailableError:
            balance = []
        try:
            cashflow = await self._client.get("/stable/cash-flow-statement", params)
        except FMPDataUnavailableError:
            cashflow = []

        by_year: dict[int, dict[str, Any]] = {}
        for item in income:
            fy = item.get("calendarYear")
            if fy:
                by_year.setdefault(int(fy), {})["income"] = item
        for item in balance:
            fy = item.get("calendarYear")
            if fy:
                by_year.setdefault(int(fy), {})["balance"] = item
        for item in cashflow:
            fy = item.get("calendarYear")
            if fy:
                by_year.setdefault(int(fy), {})["cashflow"] = item

        statements: list[NormalizedFinancialStatements] = []
        for fy in sorted(by_year, reverse=True):
            src = by_year[fy]
            inc = src.get("income", {})
            bal = src.get("balance", {})
            csh = src.get("cashflow", {})
            try:
                statements.append(
                    NormalizedFinancialStatements(
                        ticker=ticker,
                        period_type=period,
                        fiscal_year=fy,
                        revenue=_num(inc, "revenue"),
                        gross_profit=_num(inc, "grossProfit"),
                        operating_income=_num(inc, "operatingIncome"),
                        net_income=_num(inc, "netIncome"),
                        eps=_num(inc, "eps") or _num(inc, "epsDiluted"),
                        diluted_shares=_int(inc, "weightedAverageShsDil"),
                        total_assets=_num(bal, "totalAssets"),
                        total_liabilities=_num(bal, "totalLiabilities"),
                        total_equity=_num(bal, "totalStockholdersEquity"),
                        total_debt=_num(bal, "totalDebt"),
                        cash_and_equivalents=_num(bal, "cashAndCashEquivalentsShortTerm"),
                        current_assets=_num(bal, "totalCurrentAssets"),
                        current_liabilities=_num(bal, "totalCurrentLiabilities"),
                        inventory=_num(bal, "inventory"),
                        operating_cash_flow=_num(csh, "operatingCashFlow"),
                        capex=_num(csh, "capitalExpenditure"),
                        free_cash_flow=_num(csh, "freeCashFlow"),
                        interest_expense=_num(inc, "interestExpense"),
                    )
                )
            except ValidationError as exc:
                raise FMPInvalidResponseError(f"Invalid statement payload: {exc}") from exc
        return statements

    # -- price history ------------------------------------------------------------
    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[NormalizedPriceBar]:
        data = await self._client.get(
            "/stable/historical-price-eod/light", {"symbol": ticker.upper()}
        )
        # The stable "light" endpoint returns a list of bars directly, but be
        # defensive: also accept a {"symbol":..., "historical":[...]} shape.
        if isinstance(data, dict):
            bars_data = data.get("historical") or data.get("prices") or []
        elif isinstance(data, list):
            bars_data = data
        else:
            bars_data = []

        bars: list[NormalizedPriceBar] = []
        for item in bars_data[:260]:
            if not isinstance(item, dict):
                continue
            try:
                bars.append(
                    NormalizedPriceBar(
                        ticker=ticker,
                        trade_date=date.fromisoformat(str(item.get("date"))),
                        open=_num(item, "open") or Decimal("0"),
                        high=_num(item, "high") or Decimal("0"),
                        low=_num(item, "low") or Decimal("0"),
                        close=_num(item, "close") or Decimal("0"),
                        volume=_int(item, "volume") or 0,
                    )
                )
            except ValidationError as exc:
                raise FMPInvalidResponseError(f"Invalid price-bar payload: {exc}") from exc
            except ValueError:
                continue
        return bars

    # -- search -------------------------------------------------------------------
    async def search(self, query: str, limit: int = 10) -> list[NormalizedSearchHit]:
        data = await self._client.get(
            "/stable/search-symbol", {"query": query, "limit": limit}
        )
        if not isinstance(data, list):
            data = []
        hits: list[NormalizedSearchHit] = []
        for row in data:
            if not isinstance(row, dict):
                continue
            try:
                hits.append(
                    NormalizedSearchHit(
                        ticker=row.get("symbol") or "",
                        name=row.get("name") or "",
                        exchange=row.get("exchange") or "NSE",
                        sector=row.get("sector"),
                        industry=row.get("industry"),
                        market_cap=_num(row, "marketCap"),
                    )
                )
            except ValidationError:
                continue
        return hits

    # -- health --------------------------------------------------------------------
    async def health_check(self) -> ProviderHealth:
        # Lightweight, quota-friendly probe: try one profile fetch for a known symbol.
        try:
            data = await self._client.get("/stable/profile", {"symbol": "AAPL"})
            if not data:
                return ProviderHealth(status="degraded", message="no profile data")
            return ProviderHealth(status="available")
        except FMPDataUnavailableError:
            return ProviderHealth(status="degraded", message="symbol not available")
        except Exception:
            return ProviderHealth(status="unavailable")

    @staticmethod
    def _first(data: Any) -> dict[str, Any]:
        if isinstance(data, list):
            return data[0] if data else {}
        if isinstance(data, dict):
            return data
        return {}
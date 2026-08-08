"""Deterministic mock market-data provider (tests / offline demo).

Implements :class:`BaseMarketDataProvider` with deterministic fixture data so
tests are quota-free and offline, and any provider failure mode can be
simulated via :meth:`MockMarketDataProvider.set_failure`.
"""

from __future__ import annotations

import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from app.integrations.market_data.base import BaseMarketDataProvider
from app.integrations.market_data.exceptions import (
    FMPConnectionError,
    FMPInvalidResponseError,
    FMPRateLimitError,
    FMPTimeoutError,
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

# (ticker, name, exchange, sector, industry, base_price, market_cap)
_MOCK_COMPANIES: list[tuple[str, str, str, str, str, float, float]] = [
    ("TCS", "Tata Consultancy Services", "NSE", "Technology", "IT Services", 3725.0, 1.35e12),
    ("INFY", "Infosys", "NSE", "Technology", "IT Services", 1480.0, 6.1e11),
    ("RELIANCE", "Reliance Industries", "NSE", "Energy", "Conglomerates", 2920.0, 1.98e12),
    ("HDFCBANK", "HDFC Bank", "NSE", "Financials", "Banking", 1650.0, 9.2e11),
    ("TATAMOTORS", "Tata Motors", "NSE", "Consumer Discretionary", "Automobiles", 980.0, 3.6e11),
    ("ITC", "ITC", "NSE", "Consumer Staples", "FMCG", 420.0, 5.2e11),
    ("SBIN", "State Bank of India", "NSE", "Financials", "Banking", 780.0, 7.0e11),
    ("LT", "Larsen & Toubro", "NSE", "Industrials", "Engineering", 3580.0, 5.0e11),
    ("HINDUNILVR", "Hindustan Unilever", "NSE", "Consumer Staples", "FMCG", 2460.0, 5.8e11),
    ("BHARTIARTL", "Bharti Airtel", "NSE", "Communication", "Telecom", 1550.0, 8.8e11),
]


class MockMarketDataProvider(BaseMarketDataProvider):
    """Deterministic in-memory provider."""

    name = "mock"

    def __init__(self, seed: int = 42) -> None:
        self._rng = random.Random(seed)
        self._failure: str | None = None

    def set_failure(self, failure: str | None) -> None:
        """Simulate a provider failure: None | timeout | ratelimit | connection | invalid | empty."""
        self._failure = failure

    def _maybe_fail(self) -> None:
        if self._failure == "timeout":
            raise FMPTimeoutError("mock timeout")
        if self._failure == "ratelimit":
            raise FMPRateLimitError()
        if self._failure == "connection":
            raise FMPConnectionError("mock connection error")
        if self._failure == "invalid":
            raise FMPInvalidResponseError("mock invalid response")
        if self._failure == "empty":
            raise FMPDataUnavailableError("mock empty response")

    def _company(self, ticker: str) -> tuple:
        ticker = ticker.upper()
        for row in _MOCK_COMPANIES:
            if row[0] == ticker:
                return row
        return (ticker, ticker, "NSE", "Unknown", "Unknown", 100.0, 1e9)

    async def get_profile(self, ticker: str) -> NormalizedCompanyProfile:
        self._maybe_fail()
        t, name, exchange, sector, industry, _, _ = self._company(ticker)
        return NormalizedCompanyProfile(
            ticker=t,
            name=name,
            exchange=exchange,
            sector=sector,
            industry=industry,
            description=f"{name} — deterministic mock profile for offline demo/testing.",
            currency="INR",
            country="India",
        )

    async def get_quote(self, ticker: str) -> NormalizedQuote:
        self._maybe_fail()
        t, _, _, _, _, base_price, market_cap = self._company(ticker)
        price = Decimal(str(round(base_price * (1 + (self._rng.random() - 0.5) * 0.02), 2)))
        prev = price - Decimal("0.6")
        return NormalizedQuote(
            ticker=t,
            price=price,
            previous_close=prev,
            day_change=price - prev,
            day_change_pct=round((price - prev) / prev * 100, 4),
            volume=int(1_000_000 + self._rng.randint(0, 3_000_000)),
            avg_volume=2_000_000,
            market_cap=Decimal(str(market_cap)),
            high_52w=price * Decimal("1.25"),
            low_52w=price * Decimal("0.75"),
            data_as_of=datetime.now(timezone.utc),
        )

    async def get_metrics(self, ticker: str) -> NormalizedMetrics:
        self._maybe_fail()
        t, _, _, _, _, _, market_cap = self._company(ticker)
        return NormalizedMetrics(
            ticker=t,
            pe_ratio=Decimal("24.5"),
            pb_ratio=Decimal("8.1"),
            ps_ratio=Decimal("5.2"),
            ev_ebitda=Decimal("18.4"),
            roe=Decimal("27.4"),
            roa=Decimal("18.0"),
            gross_margin=Decimal("46.2"),
            operating_margin=Decimal("25.1"),
            net_margin=Decimal("21.0"),
            revenue=Decimal("245000000000"),
            revenue_growth=Decimal("8.9"),
            net_income=Decimal("51450000000"),
            eps=Decimal("142.0"),
            eps_growth=Decimal("12.1"),
            debt_to_equity=Decimal("0.09"),
            current_ratio=Decimal("2.40"),
            free_cash_flow=Decimal("41230000000"),
            dividend_yield=Decimal("1.4"),
            beta=Decimal("0.90"),
            volatility_30d=Decimal("18.5"),
            data_as_of=datetime.now(timezone.utc),
        )

    async def get_financial_statements(
        self, ticker: str, period: str = "annual", limit: int = 5
    ) -> list[NormalizedFinancialStatements]:
        self._maybe_fail()
        t, _, _, _, _, _, _ = self._company(ticker)
        now_year = date.today().year
        statements: list[NormalizedFinancialStatements] = []
        for i in range(min(limit, 5)):
            year = now_year - 1 - i
            growth = 1.0 + 0.09 * i
            revenue = Decimal(int(245_000_000_000 * growth))
            net_income = Decimal(int(51_450_000_000 * growth))
            statements.append(
                NormalizedFinancialStatements(
                    ticker=t,
                    period_type="annual",
                    fiscal_year=year,
                    revenue=revenue,
                    gross_profit=revenue * Decimal("0.46"),
                    operating_income=revenue * Decimal("0.25"),
                    net_income=net_income,
                    total_assets=revenue * Decimal("2.1"),
                    total_liabilities=revenue * Decimal("1.0"),
                    total_equity=revenue * Decimal("1.1"),
                    total_debt=revenue * Decimal("0.1"),
                    cash_and_equivalents=revenue * Decimal("0.2"),
                    operating_cash_flow=revenue * Decimal("0.2"),
                    capex=revenue * Decimal("0.03"),
                    free_cash_flow=revenue * Decimal("0.17"),
                    eps=Decimal(str(round(142.0 * growth, 2))),
                    diluted_shares=362_000_000,
                    current_assets=revenue * Decimal("0.9"),
                    current_liabilities=revenue * Decimal("0.4"),
                    inventory=revenue * Decimal("0.05"),
                    interest_expense=revenue * Decimal("0.004"),
                )
            )
        return statements

    async def get_price_history(
        self, ticker: str, period: str = "1y"
    ) -> list[NormalizedPriceBar]:
        self._maybe_fail()
        t, _, _, _, _, base_price, _ = self._company(ticker)
        rng = random.Random(hash(t) % (2**32))
        bars: list[NormalizedPriceBar] = []
        start = date.today() - timedelta(days=260)
        price = base_price * 0.8
        for i in range(250):
            price *= 1 + (rng.uniform(-0.02, 0.025))
            d = start + timedelta(days=i)
            bars.append(
                NormalizedPriceBar(
                    ticker=t,
                    trade_date=d,
                    open=Decimal(str(round(price * 0.995, 2))),
                    high=Decimal(str(round(price * 1.02, 2))),
                    low=Decimal(str(round(price * 0.98, 2))),
                    close=Decimal(str(round(price, 2))),
                    volume=int(1_000_000 + rng.randint(0, 2_000_000)),
                )
            )
        return bars

    async def search(self, query: str, limit: int = 10) -> list[NormalizedSearchHit]:
        self._maybe_fail()
        q = query.lower()
        hits = [
            NormalizedSearchHit(
                ticker=t, name=name, exchange=exchange, sector=sector, industry=industry,
                market_cap=Decimal(str(market_cap)),
            )
            for t, name, exchange, sector, industry, _, market_cap in _MOCK_COMPANIES
            if q in t.lower() or q in name.lower()
        ]
        return hits[:limit]

    async def health_check(self) -> ProviderHealth:
        if self._failure in ("timeout", "connection", "ratelimit"):
            return ProviderHealth(status="unavailable", message="mock provider unhealthy")
        return ProviderHealth(status="available")
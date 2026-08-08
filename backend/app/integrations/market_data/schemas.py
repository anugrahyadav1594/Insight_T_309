"""Normalized internal market-data schemas.

All provider output (FMP JSON, mock fixtures) is validated with Pydantic and
normalized into these schemas — the ONLY representation that services, engines
and the AI layer consume (ARCHITECTURE.md §6.3). This is what makes the market
data layer provider-agnostic.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

PeriodTypeLit = Literal["annual", "quarterly"]


class NormalizedCompanyProfile(BaseModel):
    ticker: str
    name: str
    exchange: str
    sector: str | None = None
    industry: str | None = None
    description: str | None = None
    currency: str = "INR"
    country: str | None = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("ticker")
    @classmethod
    def _upper_ticker(cls, v: str) -> str:
        return v.upper().strip()


class NormalizedQuote(BaseModel):
    ticker: str
    price: Decimal
    previous_close: Decimal | None = None
    day_change: Decimal | None = None
    day_change_pct: Decimal | None = None
    volume: int | None = None
    avg_volume: int | None = None
    market_cap: Decimal | None = None
    high_52w: Decimal | None = None
    low_52w: Decimal | None = None
    data_as_of: datetime

    model_config = ConfigDict(extra="ignore")

    @field_validator("ticker")
    @classmethod
    def _upper_ticker(cls, v: str) -> str:
        return v.upper().strip()


class NormalizedMetrics(BaseModel):
    ticker: str
    pe_ratio: Decimal | None = None
    pb_ratio: Decimal | None = None
    ps_ratio: Decimal | None = None
    ev_ebitda: Decimal | None = None
    roe: Decimal | None = None
    roa: Decimal | None = None
    gross_margin: Decimal | None = None
    operating_margin: Decimal | None = None
    net_margin: Decimal | None = None
    revenue: Decimal | None = None
    revenue_growth: Decimal | None = None
    net_income: Decimal | None = None
    eps: Decimal | None = None
    eps_growth: Decimal | None = None
    debt_to_equity: Decimal | None = None
    current_ratio: Decimal | None = None
    free_cash_flow: Decimal | None = None
    dividend_yield: Decimal | None = None
    beta: Decimal | None = None
    volatility_30d: Decimal | None = None
    data_as_of: datetime

    model_config = ConfigDict(extra="ignore")

    @field_validator("ticker")
    @classmethod
    def _upper_ticker(cls, v: str) -> str:
        return v.upper().strip()


class NormalizedFinancialStatements(BaseModel):
    ticker: str
    period_type: PeriodTypeLit = "annual"
    fiscal_year: int
    fiscal_quarter: int | None = None
    currency: str = "INR"
    revenue: Decimal | None = None
    gross_profit: Decimal | None = None
    operating_income: Decimal | None = None
    net_income: Decimal | None = None
    total_assets: Decimal | None = None
    total_liabilities: Decimal | None = None
    total_equity: Decimal | None = None
    total_debt: Decimal | None = None
    cash_and_equivalents: Decimal | None = None
    operating_cash_flow: Decimal | None = None
    capex: Decimal | None = None
    free_cash_flow: Decimal | None = None
    eps: Decimal | None = None
    diluted_shares: int | None = None
    # Calculation-only fields (not persisted).
    current_assets: Decimal | None = None
    current_liabilities: Decimal | None = None
    inventory: Decimal | None = None
    interest_expense: Decimal | None = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("ticker")
    @classmethod
    def _upper_ticker(cls, v: str) -> str:
        return v.upper().strip()


class NormalizedPriceBar(BaseModel):
    ticker: str
    trade_date: date
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int = 0

    model_config = ConfigDict(extra="ignore")

    @field_validator("ticker")
    @classmethod
    def _upper_ticker(cls, v: str) -> str:
        return v.upper().strip()


class NormalizedSearchHit(BaseModel):
    ticker: str
    name: str
    exchange: str
    sector: str | None = None
    industry: str | None = None
    market_cap: Decimal | None = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("ticker")
    @classmethod
    def _upper_ticker(cls, v: str) -> str:
        return v.upper().strip()


class ProviderHealth(BaseModel):
    """Health probe result (never exposes keys or URLs)."""

    status: Literal["available", "unavailable", "degraded"] = "available"
    message: str | None = None
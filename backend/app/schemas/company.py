"""Pydantic DTOs for company search and analysis (§7, §8)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.ai import AISummary
from app.schemas.score import (
    FundamentalScore,
    OverallScore,
    RiskScore,
    TechnicalScore,
)


# ---------------------------------------------------------------------------
# Search (§7)
# ---------------------------------------------------------------------------
class CompanySearchHit(BaseModel):
    ticker: str
    name: str
    exchange: str
    sector: str | None = None
    industry: str | None = None
    market_cap: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)


class CompanySearchResponse(BaseModel):
    query: str
    total: int
    items: list[CompanySearchHit]


# ---------------------------------------------------------------------------
# Analysis (§8.3)
# ---------------------------------------------------------------------------
class IdentityOut(BaseModel):
    name: str
    exchange: str
    sector: str | None = None
    industry: str | None = None
    description: str | None = None


class RawDataOut(BaseModel):
    """Normalized, validated raw data as received from the provider."""

    price: Decimal
    previous_close: Decimal | None = None
    day_change: Decimal | None = None
    day_change_pct: Decimal | None = None
    volume: int | None = None
    avg_volume: int | None = None
    market_cap: Decimal | None = None
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
    high_52w: Decimal | None = None
    low_52w: Decimal | None = None
    volatility_30d: Decimal | None = None

    model_config = ConfigDict(extra="forbid")


class CalculatedMetricsOut(BaseModel):
    """Metrics derived by the (pure) metrics engine (§8.4)."""

    revenue_growth: float | None = None
    eps_growth: float | None = None
    gross_margin: float | None = None
    operating_margin: float | None = None
    net_margin: float | None = None
    free_cash_flow: float | None = None
    roe: float | None = None
    roa: float | None = None
    debt_to_equity: float | None = None
    current_ratio: float | None = None
    interest_coverage: float | None = None
    fcf_yield: float | None = None
    quick_ratio: float | None = None
    position_52w: float | None = None
    ma20_slope: float | None = None
    ma50_slope: float | None = None
    ma200_slope: float | None = None
    price_vs_ma20: float | None = None
    price_vs_ma50: float | None = None
    price_vs_ma200: float | None = None
    rsi_14: float | None = None
    momentum_3m: float | None = None
    volume_ratio: float | None = None
    volatility_30d: float | None = None
    max_drawdown_1y: float | None = None

    model_config = ConfigDict(extra="forbid")


class ScoresOut(BaseModel):
    fundamental: FundamentalScore
    technical: TechnicalScore
    risk: RiskScore
    overall: OverallScore

    model_config = ConfigDict(extra="forbid")


class AnalysisResponse(BaseModel):
    ticker: str
    identity: IdentityOut
    raw_data: RawDataOut
    calculated_metrics: CalculatedMetricsOut
    scores: ScoresOut
    ai: AISummary
    data_as_of: datetime
    source: str
    stale: bool = False

    model_config = ConfigDict(extra="forbid")


class CompanyIdentityOnly(BaseModel):
    """Light identity used by watchlist/dashboard items."""

    ticker: str
    name: str
    exchange: str
    sector: str | None = None
    industry: str | None = None
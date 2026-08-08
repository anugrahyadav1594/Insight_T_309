"""Pydantic DTOs for the stock screener (§14)."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SortField = Literal[
    "overall_score", "fundamental_score", "technical_score", "risk_score",
    "market_cap", "price", "pe_ratio", "roe", "revenue_growth",
]
SortOrder = Literal["asc", "desc"]


class ScreenerFilter(BaseModel):
    """Structured screening filter (§14.2). Extra fields are rejected."""

    sector: str | None = None
    exchange: str | None = None

    market_cap_min: Decimal | None = Field(default=None, ge=0)
    market_cap_max: Decimal | None = Field(default=None, ge=0)

    pe_ratio_min: Decimal | None = Field(default=None, ge=0)
    pe_ratio_max: Decimal | None = Field(default=None, ge=0)

    roe_min: Decimal | None = None
    roe_max: Decimal | None = None
    revenue_growth_min: Decimal | None = None
    revenue_growth_max: Decimal | None = None
    debt_to_equity_min: Decimal | None = Field(default=None, ge=0)
    debt_to_equity_max: Decimal | None = Field(default=None, ge=0)

    fundamental_score_min: Decimal | None = Field(default=None, ge=0, le=100)
    fundamental_score_max: Decimal | None = Field(default=None, ge=0, le=100)
    technical_score_min: Decimal | None = Field(default=None, ge=0, le=100)
    technical_score_max: Decimal | None = Field(default=None, ge=0, le=100)
    risk_score_min: Decimal | None = Field(default=None, ge=0, le=100)
    risk_score_max: Decimal | None = Field(default=None, ge=0, le=100)
    overall_score_min: Decimal | None = Field(default=None, ge=0, le=100)
    overall_score_max: Decimal | None = Field(default=None, ge=0, le=100)

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def _check_ranges(self) -> "ScreenerFilter":
        pairs = [
            ("market_cap_min", "market_cap_max"),
            ("pe_ratio_min", "pe_ratio_max"),
            ("roe_min", "roe_max"),
            ("revenue_growth_min", "revenue_growth_max"),
            ("debt_to_equity_min", "debt_to_equity_max"),
            ("fundamental_score_min", "fundamental_score_max"),
            ("technical_score_min", "technical_score_max"),
            ("risk_score_min", "risk_score_max"),
            ("overall_score_min", "overall_score_max"),
        ]
        for lo, hi in pairs:
            lo_val = getattr(self, lo)
            hi_val = getattr(self, hi)
            if lo_val is not None and hi_val is not None and lo_val > hi_val:
                raise ValueError(f"{lo} must be <= {hi}")
        return self

    @property
    def is_empty(self) -> bool:
        return not any(
            getattr(self, f) is not None
            for f in self.model_fields
        )


class ScreenerRequest(BaseModel):
    filters: ScreenerFilter = ScreenerFilter()
    natural_language: str | None = Field(default=None, max_length=2000)
    sort_by: SortField = "overall_score"
    order: SortOrder = "desc"
    limit: int = Field(default=25, ge=1, le=50)
    offset: int = Field(default=0, ge=0, le=10000)

    model_config = ConfigDict(extra="forbid")


class ScreenerResultItem(BaseModel):
    rank: int
    ticker: str
    name: str
    exchange: str
    sector: str | None = None
    market_cap: float | None = None
    price: float | None = None
    fundamental_score: float
    technical_score: float
    risk_score: float
    overall_score: float
    recommendation: str | None = None


class ScreenerResponse(BaseModel):
    query_id: uuid.UUID
    applied_filters: dict
    count: int
    limit: int
    offset: int
    results: list[ScreenerResultItem] = []

    model_config = ConfigDict(extra="forbid")
"""Pydantic DTOs for portfolios (§11) and AI portfolio analysis (§12)."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=1000)

    model_config = ConfigDict(extra="forbid")


class PortfolioOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HoldingCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    quantity: Decimal = Field(gt=0)
    average_buy_price: Decimal = Field(gt=0)

    model_config = ConfigDict(extra="forbid")


class HoldingUpdate(BaseModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    average_buy_price: Decimal | None = Field(default=None, gt=0)

    model_config = ConfigDict(extra="forbid")

    def has_changes(self) -> bool:
        return self.quantity is not None or self.average_buy_price is not None


class PortfolioSummary(BaseModel):
    portfolio_count: int = 0
    total_value: float = 0.0
    total_invested: float = 0.0
    total_pl: float = 0.0
    total_pl_pct: float = 0.0
    holdings_count: int = 0


class SectorConcentration(BaseModel):
    sector: str
    weight: float


class PortfolioScores(BaseModel):
    fundamental: float | None = None
    technical: float | None = None
    risk: float | None = None
    overall: float | None = None
    confidence: float = 0.0


class HoldingOut(BaseModel):
    id: uuid.UUID
    ticker: str
    name: str
    quantity: float
    average_buy_price: float
    price: float | None = None
    invested_value: float
    current_value: float
    pnl: float
    pnl_pct: float
    weight: float
    overall_score: float | None = None
    recommendation: str | None = None


class PortfolioDetail(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    summary: PortfolioSummary
    sector_concentration: list[SectorConcentration] = []
    scores: PortfolioScores
    holdings: list[HoldingOut] = []

    model_config = ConfigDict(extra="forbid")


class PortfolioListItem(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    summary: PortfolioSummary


class PortfolioListResponse(BaseModel):
    items: list[PortfolioListItem]
    total: int


class PortfolioAnalyzeRequest(BaseModel):
    focus: str | None = Field(default=None, max_length=50)

    model_config = ConfigDict(extra="forbid")
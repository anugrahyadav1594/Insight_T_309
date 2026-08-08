"""Pydantic DTOs for watchlists (§13)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.company import CompanyIdentityOnly


class WatchlistCreate(BaseModel):
    name: str = Field(default="Watchlist", min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class WatchlistOut(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WatchlistListItem(BaseModel):
    id: uuid.UUID
    name: str
    item_count: int
    created_at: datetime


class WatchlistListResponse(BaseModel):
    items: list[WatchlistListItem]
    total: int


class EnrichedItem(BaseModel):
    company: CompanyIdentityOnly
    price: float | None = None
    day_change_pct: float | None = None
    signal: str | None = None
    score: float | None = None
    confidence: float | None = None


class WatchlistDetail(BaseModel):
    id: uuid.UUID
    name: str
    items: list[EnrichedItem] = []

    model_config = ConfigDict(extra="forbid")


class WatchlistItemAddRequest(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)

    model_config = ConfigDict(extra="forbid")
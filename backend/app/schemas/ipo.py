"""Pydantic DTOs for the IPO calendar feature."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

IPOStatus = Literal["ongoing", "upcoming", "ended"]


class IpoItem(BaseModel):
    id: uuid.UUID
    ticker: str
    name: str
    exchange: str
    sector: str | None = None
    price_band_low: float | None = None
    price_band_high: float | None = None
    issue_size: float | None = None
    open_date: date | None = None
    close_date: date | None = None
    listing_date: date | None = None
    allotment_date: date | None = None
    listing_open: float | None = None
    listing_close: float | None = None
    listing_gain_pct: float | None = None
    status: IPOStatus
    description: str | None = None

    model_config = ConfigDict(extra="forbid")


class IpoSegment(BaseModel):
    status: IPOStatus
    label: str
    count: int
    items: list[IpoItem] = []

    model_config = ConfigDict(extra="forbid")


class IpoCalendarResponse(BaseModel):
    generated_at: datetime
    ongoing: IpoSegment
    upcoming: IpoSegment
    ended: IpoSegment

    model_config = ConfigDict(extra="forbid")
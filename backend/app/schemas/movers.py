"""Pydantic DTOs for the gainers/losers (movers) feature."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

PeriodCode = Literal["1D", "1W", "1M", "3M", "6M", "1Y"]
Direction = Literal["gainers", "losers"]


class MoverItem(BaseModel):
    ticker: str
    name: str
    exchange: str
    sector: str | None = None
    price: float | None = None
    change_pct: float | None = None
    change: float | None = None
    direction: str
    period: str

    model_config = ConfigDict(extra="forbid")


class MoversResponse(BaseModel):
    period: str
    direction: str
    count: int
    items: list[MoverItem]

    model_config = ConfigDict(extra="forbid")
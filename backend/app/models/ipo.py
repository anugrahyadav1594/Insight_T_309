"""ORM model: ``ipos`` (IPO calendar — extension table).

IPO listing calendar for the frontend segments: ongoing, upcoming, ended.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin

MONEY = Numeric(18, 2)


class IPO(UUIDPrimaryKeyMixin, Base):
    """An IPO listing event (§NEW — IPO feature)."""

    __tablename__ = "ipos"

    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    exchange: Mapped[str] = mapped_column(String(16), nullable=False, default="NSE")
    sector: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Price band / issue size
    price_band_low: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    price_band_high: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    issue_size: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)  # ₹ crore-ish

    # Dates
    open_date: Mapped[date | None] = mapped_column(Date, nullable=True)   # bidding open
    close_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # bidding close
    listing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    allotment_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Listing day performance (for "recently ended")
    listing_open: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    listing_close: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    listing_gain_pct: Mapped[Decimal | None] = mapped_column(Numeric(10, 4), nullable=True)

    # Derived status: ongoing | upcoming | ended (computed, not stored)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="seed")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
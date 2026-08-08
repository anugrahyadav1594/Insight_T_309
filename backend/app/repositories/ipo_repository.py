"""Data access for ``ipos``."""

from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ipo import IPO


async def list_all(session: AsyncSession) -> list[IPO]:
    result = await session.execute(select(IPO))
    return list(result.scalars().all())


async def upsert_ipo(
    session: AsyncSession,
    *,
    ticker: str,
    name: str,
    exchange: str,
    sector: str | None,
    price_band_low,
    price_band_high,
    issue_size,
    open_date: date | None,
    close_date: date | None,
    listing_date: date | None,
    allotment_date: date | None,
    listing_open,
    listing_close,
    listing_gain_pct,
    description: str | None,
) -> IPO:
    result = await session.execute(select(IPO).where(IPO.ticker == ticker))
    ipo = result.scalar_one_or_none()
    if ipo is None:
        ipo = IPO(ticker=ticker)
        session.add(ipo)
    ipo.name = name
    ipo.exchange = exchange
    ipo.sector = sector
    ipo.price_band_low = price_band_low
    ipo.price_band_high = price_band_high
    ipo.issue_size = issue_size
    ipo.open_date = open_date
    ipo.close_date = close_date
    ipo.listing_date = listing_date
    ipo.allotment_date = allotment_date
    ipo.listing_open = listing_open
    ipo.listing_close = listing_close
    ipo.listing_gain_pct = listing_gain_pct
    ipo.description = description
    await session.flush()
    return ipo


async def delete_all(session: AsyncSession) -> None:
    from sqlalchemy import delete

    await session.execute(delete(IPO))
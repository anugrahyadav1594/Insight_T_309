"""IPO calendar service — segments IPOs into ongoing / upcoming / ended."""

from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ipo import IPO
from app.repositories import ipo_repository
from app.schemas.ipo import IpoCalendarResponse, IpoItem, IpoSegment
from app.utils import cache as cache_util


def _status(ipo: IPO, today: date) -> str:
    """Derive status from dates (computed, never stored)."""
    today = today or date.today()
    if ipo.open_date and ipo.close_date:
        if ipo.open_date <= today <= ipo.close_date:
            return "ongoing"
        if ipo.open_date > today:
            return "upcoming"
    if ipo.listing_date and ipo.listing_date < today:
        return "ended"
    if ipo.listing_date and ipo.listing_date >= today:
        return "upcoming"
    if ipo.open_date and ipo.open_date > today:
        return "upcoming"
    return "upcoming"


def _to_item(ipo: IPO, status: str) -> IpoItem:
    return IpoItem(
        id=ipo.id,
        ticker=ipo.ticker,
        name=ipo.name,
        exchange=ipo.exchange,
        sector=ipo.sector,
        price_band_low=float(ipo.price_band_low) if ipo.price_band_low is not None else None,
        price_band_high=float(ipo.price_band_high) if ipo.price_band_high is not None else None,
        issue_size=float(ipo.issue_size) if ipo.issue_size is not None else None,
        open_date=ipo.open_date,
        close_date=ipo.close_date,
        listing_date=ipo.listing_date,
        allotment_date=ipo.allotment_date,
        listing_open=float(ipo.listing_open) if ipo.listing_open is not None else None,
        listing_close=float(ipo.listing_close) if ipo.listing_close is not None else None,
        listing_gain_pct=float(ipo.listing_gain_pct) if ipo.listing_gain_pct is not None else None,
        status=status,
        description=ipo.description,
    )


class IpoService:
    """Builds the 3-segment IPO calendar."""

    async def calendar(self, db: AsyncSession) -> IpoCalendarResponse:
        cache_key = cache_util.ipos_key()
        cached = await cache_util.cache.get_json(cache_key)
        if cached is not None:
            return IpoCalendarResponse.model_validate(cached)

        ipos = await ipo_repository.list_all(db)
        today = date.today()

        buckets = {"ongoing": [], "upcoming": [], "ended": []}
        for ipo in ipos:
            buckets[_status(ipo, today)].append(_to_item(ipo, _status(ipo, today)))

        labels = {
            "ongoing": "Currently Ongoing",
            "upcoming": "Coming Up Soon",
            "ended": "Recently Listed",
        }

        response = IpoCalendarResponse(
            generated_at=datetime.now(timezone.utc),
            ongoing=IpoSegment(status="ongoing", label=labels["ongoing"], count=len(buckets["ongoing"]), items=buckets["ongoing"]),
            upcoming=IpoSegment(status="upcoming", label=labels["upcoming"], count=len(buckets["upcoming"]), items=buckets["upcoming"]),
            ended=IpoSegment(status="ended", label=labels["ended"], count=len(buckets["ended"]), items=buckets["ended"]),
        )
        await cache_util.cache.set_json(cache_key, response.model_dump(mode="json"),
                                        ttl=cache_util.TTLS["ipos"])
        return response


ipo_service = IpoService()
"""Movers service — top gainers/losers (ARCHITECTURE.md §8 value chain).

Reads price history from the DB (cache→db), computes period returns with the
pure movers engine, and returns the ranked list. No FMP call per request.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.movers_engine import compute_movers, normalize_period
from app.repositories import company_repository
from app.schemas.movers import MoverItem as MoversItem, MoversResponse
from app.utils import cache as cache_util


class MoversService:
    """Orchestrates the gainers/losers feature."""

    async def movers(
        self,
        db: AsyncSession,
        *,
        period: str = "1D",
        direction: str | None = None,
        limit: int = 10,
    ) -> MoversResponse:
        period_norm = normalize_period(period)
        limit = max(1, min(limit, 50))

        cache_key = cache_util.movers_key(period_norm, direction or "all", limit)
        cached = await cache_util.cache.get_json(cache_key)
        if cached is not None:
            return MoversResponse.model_validate(cached)

        companies = await company_repository.list_companies_with_prices(db)
        companies_prices: dict[str, dict] = {}
        for c in companies:
            if not c.prices:
                continue
            companies_prices[c.ticker] = {
                "name": c.name,
                "exchange": c.exchange,
                "sector": c.sector,
                "prices": [(p.trade_date, p.close) for p in c.prices],
            }

        movers = compute_movers(companies_prices, period_norm, direction or "all", limit)

        items = [
            MoversItem(
                ticker=m.ticker,
                name=m.name,
                exchange=m.exchange,
                sector=m.sector,
                price=m.price,
                change_pct=m.change_pct,
                change=m.change,
                direction=m.direction,
                period=m.period,
            )
            for m in movers
        ]
        resp = MoversResponse(
            period=period_norm,
            direction=direction or "all",
            count=len(items),
            items=items,
        )
        await cache_util.cache.set_json(cache_key, resp.model_dump(mode="json"),
                                        ttl=cache_util.TTLS["movers"])
        return resp


movers_service = MoversService()
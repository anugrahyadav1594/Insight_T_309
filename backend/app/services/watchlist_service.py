"""Watchlist service (ARCHITECTURE.md §13)."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    CompanyNotFoundError,
    ForbiddenError,
    ItemExistsError,
    ItemNotFoundError,
    WatchlistNotFoundError,
)
from app.engines.recommendation import recommend
from app.repositories import company_repository, watchlist_repository
from app.schemas.company import CompanyIdentityOnly
from app.schemas.watchlist import (
    EnrichedItem,
    WatchlistCreate,
    WatchlistDetail,
    WatchlistListItem,
    WatchlistListResponse,
    WatchlistOut,
)


class WatchlistService:
    """Orchestrates watchlist use-cases."""

    async def list(self, db: AsyncSession, user_id: uuid.UUID) -> WatchlistListResponse:
        watchlists = await watchlist_repository.list_user_watchlists(db, user_id)
        items: list[WatchlistListItem] = []
        for w in watchlists:
            count = await watchlist_repository.count_items(db, w.id)
            items.append(
                WatchlistListItem(id=w.id, name=w.name, item_count=count, created_at=w.created_at)
            )
        return WatchlistListResponse(items=items, total=len(items))

    async def create(self, db: AsyncSession, user_id: uuid.UUID, data: WatchlistCreate) -> WatchlistOut:
        w = await watchlist_repository.create_watchlist(db, user_id=user_id, name=data.name)
        return WatchlistOut.model_validate(w)

    async def _get_owned(self, db: AsyncSession, user_id: uuid.UUID, watchlist_id: uuid.UUID):
        w = await watchlist_repository.get_watchlist(db, watchlist_id)
        if w is None:
            raise WatchlistNotFoundError()
        if w.user_id != user_id:
            raise ForbiddenError()
        return w

    async def get_detail(
        self, db: AsyncSession, user_id: uuid.UUID, watchlist_id: uuid.UUID
    ) -> WatchlistDetail:
        w = await self._get_owned(db, user_id, watchlist_id)
        items = await watchlist_repository.list_item_companies(db, watchlist_id)
        enriched: list[EnrichedItem] = []
        for item in items:
            company = await company_repository.get_company_by_id(db, item.company_id)
            if company is None:
                continue
            metrics = company.metrics
            score = float(metrics.overall_score) if metrics and metrics.overall_score is not None else None
            signal = recommend(score) if score is not None else None
            enriched.append(
                EnrichedItem(
                    company=CompanyIdentityOnly(
                        ticker=company.ticker, name=company.name, exchange=company.exchange,
                        sector=company.sector, industry=company.industry,
                    ),
                    price=Decimal(str(metrics.price)) if metrics and metrics.price is not None else None,
                    day_change_pct=metrics.day_change_pct if metrics else None,
                    signal=signal,
                    score=score,
                    confidence=float(metrics.overall_score) / 100.0 if metrics and metrics.overall_score is not None else None,
                )
            )
        return WatchlistDetail(id=w.id, name=w.name, items=enriched)

    async def add_item(
        self, db: AsyncSession, user_id: uuid.UUID, watchlist_id: uuid.UUID, ticker: str
    ) -> EnrichedItem:
        await self._get_owned(db, user_id, watchlist_id)
        company = await company_repository.get_company_by_ticker(db, ticker)
        if company is None:
            raise CompanyNotFoundError(ticker)
        existing = await watchlist_repository.get_item(db, watchlist_id, company.id)
        if existing is not None:
            raise ItemExistsError()
        await watchlist_repository.add_item(
            db, watchlist_id=watchlist_id, company_id=company.id
        )
        await db.commit()
        detail = await self.get_detail(db, user_id, watchlist_id)
        for e in detail.items:
            if e.company.ticker == company.ticker:
                return e
        # Fallback: build a minimal enriched item.
        return EnrichedItem(company=CompanyIdentityOnly(
            ticker=company.ticker, name=company.name, exchange=company.exchange,
            sector=company.sector, industry=company.industry))

    async def remove_item(
        self, db: AsyncSession, user_id: uuid.UUID, watchlist_id: uuid.UUID, ticker: str
    ) -> None:
        await self._get_owned(db, user_id, watchlist_id)
        company = await company_repository.get_company_by_ticker(db, ticker)
        if company is None:
            raise CompanyNotFoundError(ticker)
        item = await watchlist_repository.get_item(db, watchlist_id, company.id)
        if item is None:
            raise ItemNotFoundError()
        await watchlist_repository.remove_item(db, item)


watchlist_service = WatchlistService()
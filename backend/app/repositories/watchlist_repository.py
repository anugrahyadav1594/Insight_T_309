"""Data access for ``watchlists`` and ``watchlist_items``."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.watchlist import Watchlist, WatchlistItem
from app.repositories.base import commit_refresh, get_by_id


async def list_user_watchlists(session: AsyncSession, user_id: uuid.UUID) -> list[Watchlist]:
    result = await session.execute(
        select(Watchlist).where(Watchlist.user_id == user_id).order_by(Watchlist.created_at.desc())
    )
    return list(result.scalars().all())


async def get_watchlist(session: AsyncSession, watchlist_id: uuid.UUID) -> Watchlist | None:
    return await get_by_id(session, Watchlist, watchlist_id)


async def get_watchlist_with_items(session: AsyncSession, watchlist_id: uuid.UUID) -> Watchlist | None:
    result = await session.execute(
        select(Watchlist).where(Watchlist.id == watchlist_id).options(selectinload(Watchlist.items)).limit(1)
    )
    return result.scalar_one_or_none()


async def create_watchlist(session: AsyncSession, *, user_id: uuid.UUID, name: str) -> Watchlist:
    watchlist = Watchlist(user_id=user_id, name=name)
    session.add(watchlist)
    return await commit_refresh(session, watchlist)


async def count_items(session: AsyncSession, watchlist_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count()).select_from(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist_id)
    )
    return int(result.scalar_one())


async def get_item(session: AsyncSession, watchlist_id: uuid.UUID, company_id: uuid.UUID) -> WatchlistItem | None:
    result = await session.execute(
        select(WatchlistItem)
        .where(WatchlistItem.watchlist_id == watchlist_id, WatchlistItem.company_id == company_id)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def add_item(session: AsyncSession, *, watchlist_id: uuid.UUID, company_id: uuid.UUID) -> WatchlistItem:
    item = WatchlistItem(watchlist_id=watchlist_id, company_id=company_id)
    session.add(item)
    await session.flush()
    return item


async def remove_item(session: AsyncSession, item: WatchlistItem) -> None:
    await session.delete(item)
    await session.commit()


async def list_item_companies(session: AsyncSession, watchlist_id: uuid.UUID) -> list[WatchlistItem]:
    result = await session.execute(
        select(WatchlistItem).where(WatchlistItem.watchlist_id == watchlist_id)
    )
    return list(result.scalars().all())

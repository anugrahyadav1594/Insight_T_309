"""Watchlist endpoints (§13, §18.7)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.common import SuccessEnvelope, ok
from app.schemas.watchlist import (
    EnrichedItem,
    WatchlistCreate,
    WatchlistDetail,
    WatchlistItemAddRequest,
    WatchlistListResponse,
    WatchlistOut,
)
from app.services.watchlist_service import watchlist_service
from app.utils import cache as cache_util

router = APIRouter(prefix="/watchlists", tags=["watchlists"], dependencies=[Depends(get_current_user)])


async def _invalidate_dashboard(user_id: uuid.UUID) -> None:
    await cache_util.cache.delete(cache_util.dashboard_key(str(user_id)))


@router.get("", response_model=SuccessEnvelope[WatchlistListResponse])
async def list_watchlists(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await watchlist_service.list(db, current_user.id)
    return ok(result)


@router.post("", response_model=SuccessEnvelope[WatchlistOut], status_code=status.HTTP_201_CREATED)
async def create_watchlist(
    body: WatchlistCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await watchlist_service.create(db, current_user.id, body)
    return ok(result)


@router.get("/{watchlist_id}", response_model=SuccessEnvelope[WatchlistDetail])
async def get_watchlist(
    watchlist_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await watchlist_service.get_detail(db, current_user.id, watchlist_id)
    return ok(result)


@router.post("/{watchlist_id}/items", response_model=SuccessEnvelope[EnrichedItem],
             status_code=status.HTTP_201_CREATED)
async def add_item(
    watchlist_id: uuid.UUID,
    body: WatchlistItemAddRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await watchlist_service.add_item(db, current_user.id, watchlist_id, body.ticker)
    await _invalidate_dashboard(current_user.id)
    return ok(result)


@router.delete("/{watchlist_id}/items/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(
    watchlist_id: uuid.UUID,
    ticker: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await watchlist_service.remove_item(db, current_user.id, watchlist_id, ticker)
    await _invalidate_dashboard(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
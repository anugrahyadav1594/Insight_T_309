"""Portfolio endpoints (§11, §18.6)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import BaseLLMProvider
from app.api.deps import CurrentUser, get_current_user, get_llm
from app.db.session import get_db
from app.schemas.ai import PortfolioAnalysisResponse
from app.schemas.common import SuccessEnvelope, ok
from app.schemas.portfolio import (
    HoldingCreate,
    HoldingOut,
    HoldingUpdate,
    PortfolioAnalyzeRequest,
    PortfolioCreate,
    PortfolioDetail,
    PortfolioListResponse,
    PortfolioOut,
    WhatIfRequest,
)
from app.services.portfolio_service import portfolio_service
from app.utils import cache as cache_util

router = APIRouter(prefix="/portfolios", tags=["portfolios"], dependencies=[Depends(get_current_user)])


async def _invalidate_dashboard(user_id: uuid.UUID) -> None:
    await cache_util.cache.delete(cache_util.dashboard_key(str(user_id)))


@router.get("", response_model=SuccessEnvelope[PortfolioListResponse])
async def list_portfolios(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    items = await portfolio_service.list(db, current_user.id)
    return ok(PortfolioListResponse(items=items, total=len(items)))


@router.post("", response_model=SuccessEnvelope[PortfolioOut], status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    body: PortfolioCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await portfolio_service.create(db, current_user.id, body)
    return ok(result)


@router.get("/{portfolio_id}", response_model=SuccessEnvelope[PortfolioDetail])
async def get_portfolio(
    portfolio_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await portfolio_service.get_detail(db, current_user.id, portfolio_id)
    return ok(result)


@router.post("/{portfolio_id}/holdings", response_model=SuccessEnvelope[HoldingOut],
             status_code=status.HTTP_201_CREATED)
async def add_holding(
    portfolio_id: uuid.UUID,
    body: HoldingCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await portfolio_service.add_holding(
        db, current_user.id, portfolio_id, body.ticker, body.quantity, body.average_buy_price
    )
    await _invalidate_dashboard(current_user.id)
    return ok(result)


@router.put("/{portfolio_id}/holdings/{holding_id}", response_model=SuccessEnvelope[HoldingOut])
async def update_holding(
    portfolio_id: uuid.UUID,
    holding_id: uuid.UUID,
    body: HoldingUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await portfolio_service.update_holding(
        db, current_user.id, portfolio_id, holding_id, body.quantity, body.average_buy_price
    )
    await _invalidate_dashboard(current_user.id)
    return ok(result)


@router.delete("/{portfolio_id}/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holding(
    portfolio_id: uuid.UUID,
    holding_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await portfolio_service.delete_holding(db, current_user.id, portfolio_id, holding_id)
    await _invalidate_dashboard(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{portfolio_id}/what-if", response_model=SuccessEnvelope[PortfolioDetail])
async def what_if_portfolio(
    portfolio_id: uuid.UUID,
    body: WhatIfRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Compute portfolio metrics/scores for a hypothetical set of holdings.

    Applies add/update/remove changes in memory and returns the recomputed
    summary, sector concentration and scores — nothing is persisted.
    """
    result = await portfolio_service.what_if(
        db, current_user.id, portfolio_id, body.holdings
    )
    return ok(result)


@router.post("/{portfolio_id}/analyze", response_model=SuccessEnvelope[PortfolioAnalysisResponse])
async def analyze_portfolio(
    portfolio_id: uuid.UUID,
    body: PortfolioAnalyzeRequest | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    llm: BaseLLMProvider = Depends(get_llm),
    db: AsyncSession = Depends(get_db),
) -> dict:
    focus = body.focus if body else None
    result = await portfolio_service.analyze(db, llm, current_user.id, portfolio_id, focus)
    return ok(result)
"""Company endpoints (§7, §8, §18.4)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import BaseLLMProvider
from app.api.deps import get_current_user, get_llm, get_provider
from app.db.session import get_db
from app.integrations.market_data.base import BaseMarketDataProvider
from app.schemas.common import SuccessEnvelope, ok
from app.schemas.company import AnalysisResponse, CompanySearchResponse
from app.services.company_service import company_service

router = APIRouter(prefix="/companies", tags=["companies"], dependencies=[Depends(get_current_user)])


@router.get("/search", response_model=SuccessEnvelope[CompanySearchResponse])
async def search(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(default=10, ge=1, le=50),
    exchange: str | None = Query(default=None, max_length=16),
    db: AsyncSession = Depends(get_db),
) -> dict:
    items = await company_service.get_search(db, query=q, limit=limit, exchange=exchange)
    return ok(
        CompanySearchResponse(
            query=q.strip(),
            total=len(items),
            items=[item for item in items],
        )
    )


@router.get("/{ticker}", response_model=SuccessEnvelope[AnalysisResponse])
async def get_analysis(
    ticker: str,
    db: AsyncSession = Depends(get_db),
    provider: BaseMarketDataProvider = Depends(get_provider),
    llm: BaseLLMProvider = Depends(get_llm),
) -> dict:
    analysis = await company_service.get_analysis(db, provider, llm, ticker)
    return ok(analysis)
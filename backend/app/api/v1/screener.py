"""Screener endpoint (§14, §18.8)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import BaseLLMProvider
from app.api.deps import CurrentUser, get_current_user, get_llm
from app.core.config import settings
from app.core.rate_limits import rate_limit
from app.db.session import get_db
from app.schemas.common import SuccessEnvelope, ok
from app.schemas.screener import ScreenerRequest, ScreenerResponse
from app.services.screener_service import screener_service

router = APIRouter(prefix="/screener", tags=["screener"], dependencies=[Depends(get_current_user)])


@router.post("/query", response_model=SuccessEnvelope[ScreenerResponse])
@rate_limit(f"{settings.RATE_LIMIT_AI_PER_MINUTE}/minute")
async def screener_query(
    request: Request,
    body: ScreenerRequest,
    current_user: CurrentUser = Depends(get_current_user),
    llm: BaseLLMProvider = Depends(get_llm),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await screener_service.query(db, llm, current_user.id, body)
    return ok(result)
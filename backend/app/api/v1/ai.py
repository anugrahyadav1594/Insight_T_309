"""AI chat endpoint (§15, §18.9)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import BaseLLMProvider
from app.api.deps import CurrentUser, get_current_user, get_llm, get_provider
from app.core.config import settings
from app.core.rate_limits import rate_limit
from app.db.session import get_db
from app.integrations.market_data.base import BaseMarketDataProvider
from app.schemas.ai import ChatReplyResponse, ChatRequest
from app.schemas.common import SuccessEnvelope, ok
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(get_current_user)])


@router.post("/chat", response_model=SuccessEnvelope[ChatReplyResponse])
@rate_limit(f"{settings.RATE_LIMIT_AI_PER_MINUTE}/minute")
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
    llm: BaseLLMProvider = Depends(get_llm),
    provider: BaseMarketDataProvider = Depends(get_provider),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await ai_service.chat(
        db,
        llm,
        provider,
        user_id=current_user.id,
        conversation_id=body.conversation_id,
        message=body.message,
        chat_context=body.context,
    )
    return ok(result)
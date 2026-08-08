"""AI orchestration (ARCHITECTURE.md §15, §16).

Builds trusted context → calls the provider → validates → persists reports /
messages. On provider failure it falls back to the deterministic LocalProvider,
so AI surfaces never hard-fail.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import BaseLLMProvider, LLMResponse
from app.ai.context_builder import (
    build_chat_context,
    build_company_context,
)
from app.ai.local_provider import LocalProvider
from app.ai.prompt_service import PromptService
from app.ai.response_validator import ResponseValidator
from app.core.exceptions import (
    ConversationNotFoundError,
    ForbiddenError,
)
from app.engines.fundamental_engine import compute_fundamental
from app.engines.technical_engine import compute_technical
from app.engines.risk_engine import compute_risk
from app.engines.overall_engine import compute_overall
from app.integrations.market_data.base import BaseMarketDataProvider
from app.repositories import ai_repository
from app.schemas.ai import (
    AISummary,
    ChatReplyResponse,
    PortfolioAnalysisResponse,
)
from app.services.market_data_service import market_data_service

logger = logging.getLogger("insight.ai")

_provider_marker: str = ""


class AIService:
    """Orchestrates the AI layer."""

    def __init__(self) -> None:
        self._prompt = PromptService()
        self._validator = ResponseValidator()
        self._local = LocalProvider()

    # -- company analysis ------------------------------------------------------
    async def generate_company_analysis(
        self,
        db: AsyncSession,
        llm_provider: BaseLLMProvider,
        snapshot: Any,
        raw_data: Any,
        calculated: Any,
        scores: Any,
        company_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
    ) -> AISummary:
        context = build_company_context(
            ticker=snapshot.company.ticker,
            identity={
                "name": snapshot.company.name,
                "exchange": snapshot.company.exchange,
                "sector": snapshot.company.sector,
                "industry": snapshot.company.industry,
            },
            raw_data=raw_data.model_dump(mode="json"),
            calculated_metrics=calculated.model_dump(mode="json"),
            scores=scores.model_dump(),
        )
        messages = self._prompt.build_company_analysis_messages(context)
        content, model = await self._call_with_fallback(llm_provider, messages, json_mode=True)

        reply = self._validator.validate_company_analysis(content, context)

        if user_id is not None:
            await ai_repository.create_report(
                db,
                user_id=user_id,
                report_type="company_analysis",
                recommendation=reply["recommendation"].lower(),
                confidence=reply["confidence"],
                scores_snapshot=scores.model_dump(),
                explanation=reply,
                raw_response={"content": content},
                model=model,
                company_id=company_id,
            )
            await db.commit()

        return AISummary(
            summary=reply["summary"],
            strengths=reply["strengths"] or reply["positive_factors"],
            risks=reply["risks"],
            opportunities=reply["opportunities"],
            reasoning=reply["reasoning"],
            supporting_metrics=reply["supporting_metrics"],
        )

    # -- portfolio analysis -------------------------------------------------------
    async def generate_portfolio_analysis(
        self,
        db: AsyncSession,
        llm_provider: BaseLLMProvider,
        portfolio_context: dict[str, Any],
        *,
        user_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        focus: str | None = None,
    ) -> PortfolioAnalysisResponse:
        messages = self._prompt.build_portfolio_analysis_messages(portfolio_context, focus)
        content, model = await self._call_with_fallback(llm_provider, messages, json_mode=True)
        validated = self._validator.validate_portfolio_analysis(content, portfolio_context)
        response = PortfolioAnalysisResponse(**validated)

        await ai_repository.create_report(
            db,
            user_id=user_id,
            report_type="portfolio_analysis",
            recommendation=None,
            confidence=portfolio_context.get("scores", {}).get("confidence"),
            scores_snapshot=portfolio_context.get("scores", {}),
            explanation=response.model_dump(),
            raw_response={"content": content},
            model=model,
            portfolio_id=portfolio_id,
        )
        await db.commit()
        return response

    # -- chat ---------------------------------------------------------------------
    async def chat(
        self,
        db: AsyncSession,
        llm_provider: BaseLLMProvider,
        provider: BaseMarketDataProvider,
        *,
        user_id: uuid.UUID,
        conversation_id: uuid.UUID | None,
        message: str,
        chat_context: Any,
    ) -> ChatReplyResponse:
        # Resolve conversation.
        if conversation_id is None:
            conversation = await ai_repository.create_conversation(
                db, user_id=user_id, title=message[:80]
            )
        else:
            conversation = await ai_repository.get_conversation(db, conversation_id)
            if conversation is None:
                raise ConversationNotFoundError()
            if conversation.user_id != user_id:
                raise ForbiddenError()

        history = await ai_repository.list_recent_messages(db, conversation.id, limit=10)
        history_msgs = [
            {"role": m.role, "content": m.content} for m in history
        ]

        # Build trusted context by scope.
        company_ctx = None
        portfolio_ctx = None
        if chat_context.scope in ("company", "metric", "comparison", "general"):
            if chat_context.company_ticker:
                company_ctx = await self._company_context(db, provider, chat_context.company_ticker)

        trusted = build_chat_context(
            scope=chat_context.scope,
            company_context=company_ctx,
            portfolio_context=portfolio_ctx,
            history=history_msgs,
        )
        messages = self._prompt.build_chat_messages(chat_context.scope, trusted, message)

        # Persist the user message (with context snapshot for audit).
        await ai_repository.add_message(
            db, conversation_id=conversation.id, role="user", content=message,
            context_snapshot=trusted,
        )

        content, model = await self._call_with_fallback(llm_provider, messages, json_mode=True)
        validated = self._validator.validate_chat_reply(content, trusted)
        reply = validated["reply"]

        await ai_repository.add_message(
            db, conversation_id=conversation.id, role="assistant", content=reply
        )
        if conversation.title is None:
            conversation.title = message[:80]
        await db.commit()

        return ChatReplyResponse(
            conversation_id=conversation.id,
            reply=reply,
            context_used=validated["context_used"],
            created_at=datetime.now(timezone.utc),
        )

    # -- helpers -------------------------------------------------------------------
    async def _company_context(
        self, db: AsyncSession, provider: BaseMarketDataProvider, ticker: str
    ) -> dict[str, Any]:
        snapshot = await market_data_service.get_company_snapshot(db, provider, ticker)
        metrics = snapshot.metrics
        raw_data = {
            "price": float(metrics.price) if metrics.price is not None else None,
            "market_cap": float(metrics.market_cap) if metrics.market_cap else None,
            "pe_ratio": float(metrics.pe_ratio) if metrics.pe_ratio else None,
            "roe": float(metrics.roe) if metrics.roe is not None else None,
            "debt_to_equity": float(metrics.debt_to_equity) if metrics.debt_to_equity is not None else None,
            "current_ratio": float(metrics.current_ratio) if metrics.current_ratio is not None else None,
        }
        engine_inputs = {
            "roe": float(metrics.roe) if metrics.roe is not None else None,
            "roa": float(metrics.roa) if metrics.roa is not None else None,
            "net_margin": float(metrics.net_margin) if metrics.net_margin is not None else None,
            "operating_margin": float(metrics.operating_margin) if metrics.operating_margin is not None else None,
            "gross_margin": float(metrics.gross_margin) if metrics.gross_margin is not None else None,
            "current_ratio": float(metrics.current_ratio) if metrics.current_ratio is not None else None,
            "debt_to_equity": float(metrics.debt_to_equity) if metrics.debt_to_equity is not None else None,
            "revenue_growth": float(metrics.revenue_growth) if metrics.revenue_growth is not None else None,
            "eps_growth": float(metrics.eps_growth) if metrics.eps_growth is not None else None,
            "market_cap": float(metrics.market_cap) if metrics.market_cap else None,
            "price": float(metrics.price) if metrics.price is not None else None,
        }
        fundamental = compute_fundamental(engine_inputs)
        technical = compute_technical(engine_inputs)
        risk = compute_risk(engine_inputs)
        overall = compute_overall(
            fundamental.score, technical.score, risk.score,
            fundamental.confidence, technical.confidence, risk.confidence,
        )
        scores = {
            "overall": overall.model_dump(),
            "fundamental": fundamental.model_dump(),
            "technical": technical.model_dump(),
            "risk": risk.model_dump(),
        }
        return build_company_context(
            ticker=snapshot.company.ticker,
            identity={"name": snapshot.company.name, "exchange": snapshot.company.exchange,
                      "sector": snapshot.company.sector},
            raw_data=raw_data,
            calculated_metrics={},
            scores=scores,
        )

    async def _call_with_fallback(
        self, llm_provider: BaseLLMProvider, messages: list[dict[str, str]], json_mode: bool
    ) -> tuple[str, str]:
        """Call the provider; on failure, fall back to the local deterministic provider."""
        try:
            resp: LLMResponse = await llm_provider.generate(messages, json_mode=json_mode)
            if resp.content.strip():
                return resp.content, resp.model
        except Exception as exc:  # noqa: BLE001 - deliberate fallback
            logger.warning("LLM provider failed (%s); using local fallback: %s", llm_provider.name, exc)

        # Local fallback.
        resp = await self._local.generate(messages, json_mode=json_mode)
        return resp.content, resp.model


ai_service = AIService()
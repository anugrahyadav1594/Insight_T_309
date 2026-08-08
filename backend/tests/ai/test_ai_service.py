"""AI service tests: context building, fallback and persistence (§24.2)."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import func, select

from app.core.exceptions import ConversationNotFoundError
from app.models.ai import AIReport
from app.repositories import user_repository
from app.schemas.ai import ChatContext, ChatRequest
from app.schemas.company import CalculatedMetricsOut, RawDataOut, ScoresOut
from app.schemas.score import (
    FundamentalScore,
    OverallScore,
    RiskScore,
    TechnicalScore,
)
from app.services.ai_service import ai_service
from app.services.market_data_service import market_data_service
from tests.conftest import MockLLMProvider


async def _user(db_session):
    user = await user_repository.create_user(
        db_session, email="ai@example.com", password_hash="x", full_name="AI User",
    )
    await db_session.commit()
    return user


def _scores() -> ScoresOut:
    fundamental = FundamentalScore(score=80, breakdown={"profitability": 80, "liquidity": 78, "efficiency": 80},
                                   confidence=0.9)
    technical = TechnicalScore(score=70, breakdown={"trend": 74, "momentum": 69, "volume_confirmation": 68},
                               confidence=0.8)
    risk = RiskScore(score=65, breakdown={"financial_risk": 60, "earnings_stability": 75,
                                          "market_risk": 58, "size_factor": 70}, confidence=0.9)
    overall = OverallScore(score=74.6, fundamental=80, technical=70, risk=65,
                           recommendation="HOLD", confidence=0.85)
    return ScoresOut(fundamental=fundamental, technical=technical, risk=risk, overall=overall)


async def test_company_analysis_persists_report(db_session, mock_provider):
    user = await _user(db_session)
    snapshot = await market_data_service.get_company_snapshot(db_session, mock_provider, "TCS")

    ai = await ai_service.generate_company_analysis(
        db_session, MockLLMProvider(), snapshot,
        RawDataOut(price=3725),
        CalculatedMetricsOut(revenue_growth=8.9),
        _scores(),
        company_id=snapshot.company.id,
        user_id=user.id,
    )
    assert ai.summary
    assert ai.reasoning

    count = (await db_session.execute(select(func.count()).select_from(AIReport))).scalar_one()
    assert count == 1


async def test_fallback_provider_on_failure(db_session, mock_provider):
    failing = MockLLMProvider(fail=True)  # raises -> local fallback used
    content, model = await ai_service._call_with_fallback(
        failing, [{"role": "user", "content": "hello"}], json_mode=False
    )
    assert content
    assert model == "local-template"


async def test_chat_persists_messages_and_returns_reply(db_session, mock_provider):
    user = await _user(db_session)
    req = ChatRequest(
        message="Why is TCS rated strongly?",
        context=ChatContext(company_ticker="TCS", scope="company"),
    )
    result = await ai_service.chat(
        db_session, MockLLMProvider(), mock_provider,
        user_id=user.id, conversation_id=None, message=req.message, chat_context=req.context,
    )
    assert result.conversation_id
    assert result.reply
    assert result.context_used is not None


async def test_chat_unknown_conversation_404(db_session, mock_provider):
    user = await _user(db_session)
    req = ChatRequest(conversation_id=uuid.uuid4(), message="hi",
                      context=ChatContext(scope="general"))
    with pytest.raises(ConversationNotFoundError):
        await ai_service.chat(
            db_session, MockLLMProvider(), mock_provider,
            user_id=user.id, conversation_id=req.conversation_id, message=req.message,
            chat_context=req.context,
        )
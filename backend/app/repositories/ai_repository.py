"""Data access for AI tables: ``ai_reports``, ``ai_conversations``, ``ai_messages``."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.ai import AIConversation, AIMessage, AIReport
from app.repositories.base import get_by_id


# -- conversations / messages -------------------------------------------------
async def create_conversation(session: AsyncSession, *, user_id: uuid.UUID, title: str | None) -> AIConversation:
    conv = AIConversation(user_id=user_id, title=title)
    session.add(conv)
    await session.flush()
    return conv


async def get_conversation(session: AsyncSession, conversation_id: uuid.UUID) -> AIConversation | None:
    return await get_by_id(session, AIConversation, conversation_id)


async def get_conversation_with_messages(session: AsyncSession, conversation_id: uuid.UUID) -> AIConversation | None:
    result = await session.execute(
        select(AIConversation)
        .where(AIConversation.id == conversation_id)
        .options(selectinload(AIConversation.messages))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def list_recent_messages(session: AsyncSession, conversation_id: uuid.UUID, limit: int = 10) -> list[AIMessage]:
    result = await session.execute(
        select(AIMessage)
        .where(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))


async def add_message(
    session: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    role: str,
    content: str,
    context_snapshot: dict | None = None,
) -> AIMessage:
    msg = AIMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
        context_snapshot=context_snapshot,
    )
    session.add(msg)
    await session.flush()
    return msg


# -- reports ------------------------------------------------------------------
async def create_report(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    report_type: str,
    recommendation: str | None,
    confidence: float | None,
    scores_snapshot: dict,
    explanation: dict | None,
    raw_response: dict | None,
    model: str | None,
    company_id: uuid.UUID | None = None,
    portfolio_id: uuid.UUID | None = None,
) -> AIReport:
    report = AIReport(
        user_id=user_id,
        company_id=company_id,
        portfolio_id=portfolio_id,
        report_type=report_type,
        recommendation=recommendation,
        confidence=confidence,
        scores_snapshot=scores_snapshot,
        explanation=explanation,
        raw_response=raw_response,
        model=model,
    )
    session.add(report)
    await session.flush()
    return report
"""ORM models: ``ai_reports``, ``ai_conversations`` and ``ai_messages``."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.company import recommendation_enum

report_type_enum = Enum(
    "company_analysis",
    "portfolio_analysis",
    name="report_type",
    native_enum=True,
    create_constraint=True,
)

message_role_enum = Enum(
    "user",
    "assistant",
    "system",
    name="role",
    native_enum=True,
    create_constraint=True,
)


class AIReport(UUIDPrimaryKeyMixin, Base):
    """Persisted AI artifact with the exact score snapshot it explained (§4.12)."""

    __tablename__ = "ai_reports"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
    portfolio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="SET NULL"), nullable=True
    )
    report_type: Mapped[str] = mapped_column(report_type_enum, nullable=False)
    recommendation: Mapped[str | None] = mapped_column(recommendation_enum, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    scores_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    explanation: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class AIConversation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Chat session header (§4.12)."""

    __tablename__ = "ai_conversations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)

    messages: Mapped[list["AIMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_ai_conversations_user_updated", "user_id", text("updated_at DESC")),
    )


class AIMessage(UUIDPrimaryKeyMixin, Base):
    """Single chat message with the injected context snapshot (§4.12)."""

    __tablename__ = "ai_messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(message_role_enum, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    context_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    conversation: Mapped[AIConversation] = relationship(back_populates="messages")

    __table_args__ = (
        Index("ix_ai_messages_conversation_created", "conversation_id", "created_at"),
    )
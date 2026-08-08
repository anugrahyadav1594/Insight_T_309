"""ORM models: ``screening_queries`` and ``screening_results``."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin
from app.models.company import PERCENT


class ScreeningQuery(UUIDPrimaryKeyMixin, Base):
    """Persisted screening request (NL + validated structured filter) (§4.13)."""

    __tablename__ = "screening_queries"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    natural_language: Mapped[str | None] = mapped_column(Text, nullable=True)
    structured_filter: Mapped[dict] = mapped_column(JSONB, nullable=False)
    result_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    execution_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    results: Mapped[list["ScreeningResult"]] = relationship(
        back_populates="query", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_screening_queries_user_created", "user_id", text("created_at DESC")),
    )


class ScreeningResult(UUIDPrimaryKeyMixin, Base):
    """Snapshot of ranked results for a query (§4.13)."""

    __tablename__ = "screening_results"
    __table_args__ = (
        UniqueConstraint("screening_query_id", "company_id", name="uq_screening_results_query_company"),
        Index("ix_screening_results_query_rank", "screening_query_id", "rank"),
    )

    screening_query_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("screening_queries.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    fundamental_score: Mapped[float] = mapped_column(PERCENT, nullable=False)
    technical_score: Mapped[float] = mapped_column(PERCENT, nullable=False)
    risk_score: Mapped[float] = mapped_column(PERCENT, nullable=False)
    overall_score: Mapped[float] = mapped_column(PERCENT, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    query: Mapped[ScreeningQuery] = relationship(back_populates="results")
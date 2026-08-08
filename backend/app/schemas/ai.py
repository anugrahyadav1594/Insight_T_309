"""Pydantic DTOs for the AI layer (§12, §15, §16)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Impact = Literal["positive", "negative", "neutral"]


class SupportingMetric(BaseModel):
    metric: str
    value: float
    impact: Impact = "neutral"


class SourceCitation(BaseModel):
    """Phase-2 slot for full source citations (§16.2)."""

    type: str = "metric"
    name: str
    period: str | None = None
    provider: str | None = None

    model_config = ConfigDict(extra="forbid")


class Explainability(BaseModel):
    """§16.1 — every AI recommendation carries this shape."""

    recommendation: str
    confidence: float = Field(ge=0, le=1)
    reasoning: str
    supporting_metrics: list[SupportingMetric] = []
    risks: list[str] = []
    positive_factors: list[str] = []
    sources: list[SourceCitation] = []

    model_config = ConfigDict(extra="forbid")


class AISummary(BaseModel):
    """Company-analysis AI layer (§8.3)."""

    summary: str
    strengths: list[str] = []
    risks: list[str] = []
    opportunities: list[str] = []
    reasoning: str
    supporting_metrics: list[SupportingMetric] = []


class CompanyAnalysisReply(BaseModel):
    """Validated company-analysis reply: §8.3 AI layer + §16 explainability."""

    summary: str
    strengths: list[str] = []
    risks: list[str] = []
    opportunities: list[str] = []
    reasoning: str
    recommendation: str
    confidence: float = Field(ge=0, le=1)
    supporting_metrics: list[SupportingMetric] = []
    positive_factors: list[str] = []
    sources: list[SourceCitation] = []

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# Chat (§15)
# ---------------------------------------------------------------------------
class ChatContext(BaseModel):
    """User-supplied context for a chat turn (§15.1)."""

    company_ticker: str | None = None
    portfolio_id: uuid.UUID | None = None
    scope: Literal["company", "portfolio", "metric", "comparison", "general"] = "general"
    tickers: list[str] = []

    model_config = ConfigDict(extra="forbid")


class ChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    message: str = Field(min_length=1, max_length=8000)
    context: ChatContext = ChatContext()

    model_config = ConfigDict(extra="forbid")


class ChatReplyResponse(BaseModel):
    conversation_id: uuid.UUID
    reply: str
    context_used: dict
    created_at: datetime


# ---------------------------------------------------------------------------
# Portfolio analysis (§12.3)
# ---------------------------------------------------------------------------
class ConcentrationRisk(BaseModel):
    sector: str
    weight: float
    note: str


class PortfolioAnalysisResponse(BaseModel):
    summary: str
    strengths: list[str] = []
    weaknesses: list[str] = []
    concentration_risks: list[ConcentrationRisk] = []
    concerns: list[str] = []
    opportunities: list[str] = []
    explanation: str
    scores: dict[str, float]
    disclaimer: str = "Decision support only. Not investment advice."

    model_config = ConfigDict(extra="forbid")
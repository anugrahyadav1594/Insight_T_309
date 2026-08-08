"""Pydantic DTOs for scoring-engine output (engines never do I/O)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

RecommendationLabel = Literal["STRONG_BUY", "BUY", "HOLD", "NEUTRAL", "BEARISH"]


class FactorScore(BaseModel):
    """A single sub-factor's 0-100 score and its data availability."""

    name: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    data_available: bool = True


class EngineScoreResult(BaseModel):
    """Returned by each deterministic engine (§9.6)."""

    score: float = Field(ge=0, le=100)
    breakdown: dict[str, float]
    confidence: float = Field(ge=0, le=1)
    warnings: list[str] = []

    model_config = ConfigDict(extra="forbid")


class FundamentalScore(EngineScoreResult):
    breakdown: dict[str, float]  # profitability, liquidity, efficiency


class TechnicalScore(EngineScoreResult):
    breakdown: dict[str, float]  # trend, momentum, volume_confirmation


class RiskScore(EngineScoreResult):
    breakdown: dict[str, float]  # financial_risk, earnings_stability, market_risk, size_factor


class OverallScore(BaseModel):
    """Combined overall score with a deterministic recommendation."""

    score: float = Field(ge=0, le=100)
    fundamental: float = Field(ge=0, le=100)
    technical: float = Field(ge=0, le=100)
    risk: float = Field(ge=0, le=100)
    recommendation: RecommendationLabel
    confidence: float = Field(ge=0, le=1)

    model_config = ConfigDict(extra="forbid")


class ScoresBundle(BaseModel):
    """All four engine scores together (used in analysis responses)."""

    fundamental: FundamentalScore
    technical: TechnicalScore
    risk: RiskScore
    overall: OverallScore
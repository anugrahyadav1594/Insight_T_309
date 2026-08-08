"""Pydantic DTOs for the aggregated dashboard (§10)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.portfolio import PortfolioScores, PortfolioSummary


class RiskHealth(BaseModel):
    score: float
    label: str
    top_risks: list[str] = []

    model_config = ConfigDict(extra="forbid")


class WatchlistAlert(BaseModel):
    ticker: str
    signal: str
    reason: str
    at: datetime


class WatchlistSummary(BaseModel):
    count: int = 0
    alerts: list[WatchlistAlert] = []


class FeaturedInsight(BaseModel):
    ticker: str
    name: str
    overall_score: float
    recommendation: str
    confidence: float
    ai_summary: str = ""


class Signal(BaseModel):
    ticker: str
    action: str
    score: float
    confidence: float
    driver: str = ""


class DashboardResponse(BaseModel):
    portfolio_summary: PortfolioSummary
    portfolio_scores: PortfolioScores
    risk_health: RiskHealth
    watchlist: WatchlistSummary
    featured_insight: FeaturedInsight | None = None
    signals: list[Signal] = []
    generated_at: datetime

    model_config = ConfigDict(extra="forbid")
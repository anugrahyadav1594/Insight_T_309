"""Aggregated dashboard service (ARCHITECTURE.md §10)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.portfolio_engine import risk_health_label
from app.schemas.portfolio import PortfolioDetail
from app.engines.recommendation import recommend
from app.repositories import company_repository, watchlist_repository
from app.schemas.dashboard import (
    DashboardResponse,
    FeaturedInsight,
    RiskHealth,
    Signal,
    WatchlistAlert,
    WatchlistSummary,
)
from app.schemas.portfolio import PortfolioScores, PortfolioSummary
from app.services.portfolio_service import portfolio_service
from app.utils import cache as cache_util


class DashboardService:
    """Builds the single aggregated home payload."""

    async def aggregate(self, db: AsyncSession, user_id: uuid.UUID) -> DashboardResponse:
        cache_key = cache_util.dashboard_key(str(user_id))
        cached = await cache_util.cache.get_json(cache_key)
        if cached is not None:
            return DashboardResponse.model_validate(cached)

        # Fetch each portfolio's detail once (provides summary + scores).
        items = await portfolio_service.list(db, user_id)
        details = [await portfolio_service.get_detail(db, user_id, p.id) for p in items]
        portfolio_summary, portfolio_scores = self._aggregate_portfolios(details)

        # Risk health.
        risk_score = portfolio_scores.risk
        concentration_risks: list[str] = []
        for detail in details:
            for c in detail.sector_concentration:
                if c.weight >= 40:
                    concentration_risks.append(f"High concentration in {c.sector}")
        risk_health = RiskHealth(
            score=risk_score if risk_score is not None else 50.0,
            label=risk_health_label(risk_score),
            top_risks=(concentration_risks or ["No significant concentration risk detected"])[:3],
        )

        watchlist_summary = await self._watchlist_summary(db, user_id)

        top = await company_repository.top_by_score(db, limit=20)
        featured, signals = self._build_featured_and_signals(top)

        response = DashboardResponse(
            portfolio_summary=portfolio_summary,
            portfolio_scores=portfolio_scores,
            risk_health=risk_health,
            watchlist=watchlist_summary,
            featured_insight=featured,
            signals=signals,
            generated_at=datetime.now(timezone.utc),
        )
        await cache_util.cache.set_json(cache_key, response.model_dump(mode="json"),
                                        ttl=cache_util.TTLS["dashboard"])
        return response

    # -- helpers -------------------------------------------------------------------
    @staticmethod
    def _aggregate_portfolios(portfolios: list[PortfolioDetail]) -> tuple[PortfolioSummary, PortfolioScores]:
        total_value = sum(float(p.summary.total_value) for p in portfolios)
        total_invested = sum(float(p.summary.total_invested) for p in portfolios)
        holdings_count = sum(p.summary.holdings_count for p in portfolios)
        total_pl = total_value - total_invested
        total_pl_pct = (total_pl / total_invested * 100.0) if total_invested else 0.0

        summary = PortfolioSummary(
            portfolio_count=len(portfolios),
            total_value=round(total_value, 2),
            total_invested=round(total_invested, 2),
            total_pl=round(total_pl, 2),
            total_pl_pct=round(total_pl_pct, 4),
            holdings_count=holdings_count,
        )

        keys = ("fundamental", "technical", "risk", "overall")
        acc: dict[str, float] = {k: 0.0 for k in keys}
        covered = 0.0
        for p in portfolios:
            val = float(p.summary.total_value)
            if val <= 0:
                continue
            for k in keys:
                v = getattr(p.scores, k)
                if v is not None:
                    acc[k] += float(v) * val
            if p.scores.overall is not None:
                covered += val

        if covered > 0:
            scores_dict = {k: round(acc[k] / covered, 1) for k in keys}
        else:
            scores_dict = {k: None for k in keys}
        confidence = (covered / total_value) if total_value else 0.0
        return summary, PortfolioScores(
            fundamental=scores_dict["fundamental"],
            technical=scores_dict["technical"],
            risk=scores_dict["risk"],
            overall=scores_dict["overall"],
            confidence=round(min(confidence, 1.0), 4),
        )

    async def _watchlist_summary(self, db: AsyncSession, user_id: uuid.UUID) -> WatchlistSummary:
        from app.services.watchlist_service import watchlist_service

        watchlists = await watchlist_repository.list_user_watchlists(db, user_id)
        alerts: list[WatchlistAlert] = []
        count = 0
        for w in watchlists:
            detail = await watchlist_service.get_detail(db, user_id, w.id)
            count += len(detail.items)
            for item in detail.items:
                if item.signal in ("BUY", "STRONG_BUY"):
                    alerts.append(
                        WatchlistAlert(
                            ticker=item.company.ticker,
                            signal=item.signal,
                            reason=f"Overall score {item.score}, favourable signal",
                            at=datetime.now(timezone.utc),
                        )
                    )
        return WatchlistSummary(count=count, alerts=alerts[:10])

    @staticmethod
    def _build_featured_and_signals(
        companies: list[Any],
    ) -> tuple[FeaturedInsight | None, list[Signal]]:
        featured: FeaturedInsight | None = None
        signals: list[Signal] = []
        for company in companies:
            metrics = company.metrics
            score = float(metrics.overall_score) if metrics and metrics.overall_score is not None else None
            if score is None:
                continue
            rec = recommend(score)
            confidence = round(min(score / 100.0, 1.0), 4)
            if featured is None:
                featured = FeaturedInsight(
                    ticker=company.ticker,
                    name=company.name,
                    overall_score=round(score, 1),
                    recommendation=rec,
                    confidence=confidence,
                )
            if len(signals) < 5:
                signals.append(
                    Signal(
                        ticker=company.ticker,
                        action=rec,
                        score=round(score, 1),
                        confidence=confidence,
                        driver=f"Overall score {score:.1f}, {rec}",
                    )
                )
        return featured, signals


dashboard_service = DashboardService()
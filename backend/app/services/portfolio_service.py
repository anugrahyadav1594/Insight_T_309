"""Portfolio service (ARCHITECTURE.md §11) + AI portfolio analysis (§12)."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import BaseLLMProvider
from app.core.exceptions import (
    ForbiddenError,
    HoldingExistsError,
    HoldingNotFoundError,
    PortfolioNotFoundError,
)
from app.engines.portfolio_engine import (
    compute_holding_math,
    compute_portfolio_summary,
    compute_sector_concentration,
    compute_weighted_scores,
)
from app.models.company import Company
from app.models.portfolio import Portfolio, PortfolioHolding
from app.repositories import company_repository, portfolio_repository
from app.schemas.ai import PortfolioAnalysisResponse
from app.schemas.portfolio import (
    HoldingOut,
    PortfolioCreate,
    PortfolioDetail,
    PortfolioListItem,
    PortfolioOut,
    PortfolioScores,
    PortfolioSummary,
    SectorConcentration,
)
from app.services.ai_service import ai_service
from app.ai.context_builder import build_portfolio_context


class PortfolioService:
    """Orchestrates portfolio use-cases."""

    async def list(self, db: AsyncSession, user_id: uuid.UUID) -> list[PortfolioListItem]:
        portfolios = await portfolio_repository.list_user_portfolios(db, user_id)
        items: list[PortfolioListItem] = []
        for p in portfolios:
            detail = await self.get_detail(db, user_id, p.id)
            items.append(
                PortfolioListItem(
                    id=p.id, name=p.name, description=p.description,
                    created_at=p.created_at, summary=detail.summary,
                )
            )
        return items

    async def create(self, db: AsyncSession, user_id: uuid.UUID, data: PortfolioCreate) -> PortfolioOut:
        portfolio = await portfolio_repository.create_portfolio(
            db, user_id=user_id, name=data.name, description=data.description
        )
        return PortfolioOut.model_validate(portfolio)

    async def _get_owned(self, db: AsyncSession, user_id: uuid.UUID, portfolio_id: uuid.UUID) -> Portfolio:
        portfolio = await portfolio_repository.get_portfolio_with_holdings(db, portfolio_id)
        if portfolio is None:
            raise PortfolioNotFoundError()
        if portfolio.user_id != user_id:
            raise ForbiddenError()
        return portfolio

    async def get_detail(
        self, db: AsyncSession, user_id: uuid.UUID, portfolio_id: uuid.UUID
    ) -> PortfolioDetail:
        portfolio = await self._get_owned(db, user_id, portfolio_id)
        holdings = portfolio.holdings
        enriched, total_value = await self._enrich_holdings(db, holdings)

        summary_data = compute_portfolio_summary(
            [{"invested_value": h["invested_value"], "current_value": h["current_value"]} for h in enriched]
        )
        summary = PortfolioSummary(**summary_data)

        concentration = compute_sector_concentration(
            [{"sector": h["sector"], "current_value": h["current_value"]} for h in enriched]
        )
        weighted = compute_weighted_scores(
            [
                {
                    "ticker": h["ticker"],
                    "current_value": h["current_value"],
                    "fundamental_score": h.get("fundamental_score"),
                    "technical_score": h.get("technical_score"),
                    "risk_score": h.get("risk_score"),
                    "overall_score": h.get("overall_score"),
                }
                for h in enriched
            ]
        )
        scores = PortfolioScores(
            fundamental=weighted.get("fundamental"),
            technical=weighted.get("technical"),
            risk=weighted.get("risk"),
            overall=weighted.get("overall"),
            confidence=weighted.get("confidence", 0.0),
        )

        holding_outs = [HoldingOut(**h) for h in enriched]

        return PortfolioDetail(
            id=portfolio.id,
            name=portfolio.name,
            description=portfolio.description,
            created_at=portfolio.created_at,
            summary=summary,
            sector_concentration=[SectorConcentration(**c) for c in concentration],
            scores=scores,
            holdings=holding_outs,
        )

    async def add_holding(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        ticker: str,
        quantity: Decimal,
        average_buy_price: Decimal,
    ) -> HoldingOut:
        await self._get_owned(db, user_id, portfolio_id)
        company = await company_repository.get_company_by_ticker(db, ticker)
        if company is None:
            from app.core.exceptions import CompanyNotFoundError

            raise CompanyNotFoundError(ticker)

        existing = await portfolio_repository.get_holding_by_company(db, portfolio_id, company.id)
        if existing is not None:
            raise HoldingExistsError()

        holding = await portfolio_repository.add_holding(
            db, portfolio_id=portfolio_id, company_id=company.id,
            quantity=quantity, average_buy_price=average_buy_price,
        )
        await db.commit()
        return await self._build_holding_out(db, holding, company)

    async def update_holding(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        holding_id: uuid.UUID,
        quantity: Decimal | None,
        average_buy_price: Decimal | None,
    ) -> HoldingOut:
        portfolio = await self._get_owned(db, user_id, portfolio_id)
        holding = await portfolio_repository.get_holding(db, holding_id)
        if holding is None or holding.portfolio_id != portfolio.id:
            raise HoldingNotFoundError()
        await portfolio_repository.update_holding(
            db, holding, quantity=quantity, average_buy_price=average_buy_price
        )
        await db.commit()
        company = await company_repository.get_company_by_id(db, holding.company_id)
        return await self._build_holding_out(db, holding, company)

    async def delete_holding(
        self, db: AsyncSession, user_id: uuid.UUID, portfolio_id: uuid.UUID, holding_id: uuid.UUID
    ) -> None:
        portfolio = await self._get_owned(db, user_id, portfolio_id)
        holding = await portfolio_repository.get_holding(db, holding_id)
        if holding is None or holding.portfolio_id != portfolio.id:
            raise HoldingNotFoundError()
        await portfolio_repository.delete_holding(db, holding)

    async def analyze(
        self,
        db: AsyncSession,
        llm_provider: BaseLLMProvider,
        user_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        focus: str | None = None,
    ) -> PortfolioAnalysisResponse:
        detail = await self.get_detail(db, user_id, portfolio_id)
        context = build_portfolio_context(
            summary=detail.summary.model_dump(),
            sector_concentration=[c.model_dump() for c in detail.sector_concentration],
            scores=detail.scores.model_dump(),
            holdings=[
                {
                    "ticker": h.ticker,
                    "weight": h.weight,
                    "overall_score": h.overall_score,
                    "recommendation": h.recommendation,
                }
                for h in detail.holdings
            ],
        )
        return await ai_service.generate_portfolio_analysis(
            db, llm_provider, context, user_id=user_id, portfolio_id=portfolio_id, focus=focus
        )

    # -- helpers -------------------------------------------------------------------
    async def _enrich_holdings(
        self, db: AsyncSession, holdings: list[PortfolioHolding]
    ) -> tuple[list[dict[str, Any]], float]:
        enriched: list[dict[str, Any]] = []
        total_value = 0.0
        for h in holdings:
            company = await company_repository.get_company_by_id(db, h.company_id)
            metrics = company.metrics if company else None
            price = float(metrics.price) if metrics and metrics.price is not None else float(h.average_buy_price)
            math = compute_holding_math(h.quantity, h.average_buy_price, price)
            weight = 0.0
            total_value += math["current_value"]
            row = {
                "id": h.id,
                "ticker": company.ticker if company else "",
                "name": company.name if company else "",
                "sector": company.sector if company else None,
                "quantity": float(h.quantity),
                "average_buy_price": float(h.average_buy_price),
                "price": price,
                **math,
                "weight": weight,  # computed after total known
                "fundamental_score": float(metrics.fundamental_score) if metrics and metrics.fundamental_score is not None else None,
                "technical_score": float(metrics.technical_score) if metrics and metrics.technical_score is not None else None,
                "risk_score": float(metrics.risk_score) if metrics and metrics.risk_score is not None else None,
                "overall_score": float(metrics.overall_score) if metrics and metrics.overall_score is not None else None,
                "recommendation": (metrics.recommendation.upper() if metrics and metrics.recommendation else None),
            }
            enriched.append(row)
        for row in enriched:
            row["weight"] = round(row["current_value"] / total_value * 100.0, 4) if total_value else 0.0
        return enriched, total_value

    async def _build_holding_out(
        self, db: AsyncSession, holding: PortfolioHolding, company: Company | None
    ) -> HoldingOut:
        metrics = company.metrics if company else None
        price = float(metrics.price) if metrics and metrics.price is not None else float(holding.average_buy_price)
        math = compute_holding_math(holding.quantity, holding.average_buy_price, price)
        return HoldingOut(
            id=holding.id,
            ticker=company.ticker if company else "",
            name=company.name if company else "",
            quantity=holding.quantity,
            average_buy_price=holding.average_buy_price,
            price=price,
            invested_value=Decimal(str(math["invested_value"])),
            current_value=Decimal(str(math["current_value"])),
            pnl=Decimal(str(math["pnl"])),
            pnl_pct=Decimal(str(math["pnl_pct"])),
            weight=0.0,
            overall_score=float(metrics.overall_score) if metrics and metrics.overall_score is not None else None,
            recommendation=(metrics.recommendation.upper() if metrics and metrics.recommendation else None),
        )


portfolio_service = PortfolioService()
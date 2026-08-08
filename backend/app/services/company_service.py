"""Company analysis pipeline (ARCHITECTURE.md §8).

raw_data → calculated_metrics → scores → ai. This service orchestrates the
market-data facade, the metrics engine, the scoring engines and the AI layer.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import BaseLLMProvider
from app.core.exceptions import CompanyNotFoundError
from app.engines.fundamental_engine import compute_fundamental
from app.engines.technical_engine import compute_technical
from app.engines.risk_engine import compute_risk
from app.engines.overall_engine import compute_overall
from app.engines.metrics_engine import build_calculated_metrics, compute_price_metrics
from app.integrations.market_data.base import BaseMarketDataProvider
from app.integrations.market_data.schemas import (
    NormalizedFinancialStatements,
    NormalizedPriceBar,
)
from app.repositories import company_repository
from app.schemas.company import (
    AnalysisResponse,
    CalculatedMetricsOut,
    CompanySearchHit,
    IdentityOut,
    RawDataOut,
    ScoresOut,
)
from app.services.market_data_service import market_data_service
from app.services.ai_service import ai_service
from app.utils import cache as cache_util

logger = logging.getLogger("insight.company")

# RawDataOut fields that map 1:1 onto CompanyMetrics columns.
_RAW_FIELDS = [
    "price", "previous_close", "day_change", "day_change_pct", "volume", "avg_volume",
    "market_cap", "pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda", "roe", "roa",
    "gross_margin", "operating_margin", "net_margin", "revenue", "revenue_growth",
    "net_income", "eps", "eps_growth", "debt_to_equity", "current_ratio",
    "free_cash_flow", "dividend_yield", "beta", "high_52w", "low_52w", "volatility_30d",
]


def _prices_to_normalized(prices: list[Any]) -> list[NormalizedPriceBar]:
    return [
        NormalizedPriceBar(
            ticker=p.company.ticker if p.company else "",
            trade_date=p.trade_date,
            open=p.open, high=p.high, low=p.low, close=p.close, volume=p.volume,
        )
        for p in prices
    ]


def _statements_to_normalized(statements: list[Any]) -> list[NormalizedFinancialStatements]:
    out: list[NormalizedFinancialStatements] = []
    for s in statements:
        out.append(
            NormalizedFinancialStatements(
                ticker=s.company.ticker if s.company else "",
                period_type=s.period_type,
                fiscal_year=s.fiscal_year,
                fiscal_quarter=s.fiscal_quarter,
                currency=s.currency,
                revenue=s.revenue,
                gross_profit=s.gross_profit,
                operating_income=s.operating_income,
                net_income=s.net_income,
                total_assets=s.total_assets,
                total_liabilities=s.total_liabilities,
                total_equity=s.total_equity,
                total_debt=s.total_debt,
                cash_and_equivalents=s.cash_and_equivalents,
                operating_cash_flow=s.operating_cash_flow,
                capex=s.capex,
                free_cash_flow=s.free_cash_flow,
                eps=s.eps,
                diluted_shares=s.diluted_shares,
            )
        )
    return out


class CompanyService:
    """Builds the full company-analysis payload."""

    async def get_analysis(
        self,
        db: AsyncSession,
        provider: BaseMarketDataProvider,
        llm_provider: BaseLLMProvider,
        ticker: str,
    ) -> AnalysisResponse:
        ticker = ticker.upper()
        cache_key = cache_util.company_analysis_key(ticker)
        cached = await cache_util.cache.get_json(cache_key)
        if cached is not None:
            return AnalysisResponse.model_validate(cached)

        snapshot = await market_data_service.get_company_snapshot(db, provider, ticker)
        metrics = snapshot.metrics
        company = snapshot.company

        # --- raw_data ------------------------------------------------------
        raw_data = RawDataOut(
            **{field: getattr(metrics, field) for field in _RAW_FIELDS}
        )

        # --- calculated metrics ----------------------------------------------
        norm_statements = _statements_to_normalized(snapshot.statements)
        norm_prices = _prices_to_normalized(snapshot.prices)
        raw_metrics = {
            field: (float(getattr(metrics, field)) if getattr(metrics, field) is not None else None)
            for field in _RAW_FIELDS
        }
        raw_metrics.update(compute_price_metrics(norm_prices))
        calculated = build_calculated_metrics(
            metrics=raw_metrics,
            statements=norm_statements,
            prices=norm_prices,
            market_cap=float(metrics.market_cap) if metrics.market_cap else None,
        )
        # Only the schema's fields belong in calculated_metrics; valuation
        # ratios (pe/pb/ps/ev, etc.) live in raw_data.
        calc_fields = set(CalculatedMetricsOut.model_fields)
        calculated_out = CalculatedMetricsOut(
            **{k: (float(v) if v is not None else None)
               for k, v in calculated.items() if k in calc_fields}
        )

        # --- scores -----------------------------------------------------------
        engine_inputs = {
            k: v for k, v in raw_metrics.items() if v is not None
        }
        engine_inputs.update(
            {k: v for k, v in calculated.items() if v is not None}
        )
        scores = self._compute_scores(engine_inputs)

        # --- AI ----------------------------------------------------------------
        ai_summary = await ai_service.generate_company_analysis(
            db, llm_provider, snapshot, raw_data, calculated_out, scores, company.id
        )

        response = AnalysisResponse(
            ticker=ticker,
            identity=IdentityOut(
                name=company.name,
                exchange=company.exchange,
                sector=company.sector,
                industry=company.industry,
                description=company.description,
            ),
            raw_data=raw_data,
            calculated_metrics=calculated_out,
            scores=scores,
            ai=ai_summary,
            data_as_of=snapshot.data_as_of,
            source=snapshot.source,
            stale=snapshot.stale,
        )
        await cache_util.cache.set_json(cache_key, response.model_dump(mode="json"),
                                        ttl=cache_util.TTLS["analysis"])
        return response

    @staticmethod
    def _compute_scores(inputs: dict[str, float | None]) -> ScoresOut:
        fundamental = compute_fundamental(inputs)
        technical = compute_technical(inputs)
        risk = compute_risk(inputs)
        overall = compute_overall(
            fundamental.score, technical.score, risk.score,
            fundamental.confidence, technical.confidence, risk.confidence,
        )
        return ScoresOut(
            fundamental=fundamental,
            technical=technical,
            risk=risk,
            overall=overall,
        )

    async def get_search(
        self, db: AsyncSession, *, query: str, limit: int, exchange: str | None
    ) -> list[Any]:
        cache_key = cache_util.search_key(query, limit, exchange)
        cached = await cache_util.cache.get_json(cache_key)
        if cached is not None:
            return [CompanySearchHit.model_validate(h) for h in cached]
        hits = await company_repository.search_companies(db, query, limit, exchange)
        await cache_util.cache.set_json(
            cache_key, [h.model_dump(mode="json") for h in hits], ttl=cache_util.TTLS["search"]
        )
        return hits

    async def require_company(self, db: AsyncSession, ticker: str) -> Any:
        company = await company_repository.get_company_by_ticker(db, ticker)
        if company is None:
            raise CompanyNotFoundError(ticker)
        return company


company_service = CompanyService()
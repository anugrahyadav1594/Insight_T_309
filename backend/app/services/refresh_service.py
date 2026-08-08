"""Company data refresh pipeline (ARCHITECTURE.md §29.7).

``refresh_company_data`` is the single place that turns validated, normalized
provider data into persisted PostgreSQL rows + recomputed scores + Redis cache.
It is also exposed as a background task (see :mod:`app.workers.tasks`).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.metrics_engine import build_calculated_metrics, compute_price_metrics
from app.engines.fundamental_engine import compute_fundamental
from app.engines.technical_engine import compute_technical
from app.engines.risk_engine import compute_risk
from app.engines.overall_engine import compute_overall
from app.integrations.market_data.base import BaseMarketDataProvider
from app.repositories import company_repository
from app.utils import cache as cache_util

logger = logging.getLogger("insight.refresh")


def _engine_inputs(
    metrics: dict[str, Any],
    computed: dict[str, float | None],
) -> dict[str, float | None]:
    """Merge raw metrics and calculated metrics into scoring-engine inputs."""
    inputs: dict[str, float | None] = {}
    for key, val in metrics.items():
        if val is not None:
            inputs[key] = float(val)
    for key, val in computed.items():
        if val is not None:
            inputs[key] = float(val)
    return inputs


def _metrics_dict(quote: Any, metrics: Any, computed: dict[str, float | None]) -> dict[str, Any]:
    """Build the company_metrics column dict from normalized data."""
    row: dict[str, Any] = {
        "price": quote.price,
        "previous_close": quote.previous_close,
        "day_change": quote.day_change,
        "day_change_pct": quote.day_change_pct,
        "volume": quote.volume,
        "avg_volume": quote.avg_volume,
        "market_cap": quote.market_cap,
        "high_52w": quote.high_52w,
        "low_52w": quote.low_52w,
    }
    if metrics is not None:
        for field in (
            "pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda", "roe", "roa",
            "gross_margin", "operating_margin", "net_margin", "revenue",
            "revenue_growth", "net_income", "eps", "eps_growth",
            "debt_to_equity", "current_ratio", "free_cash_flow",
            "dividend_yield", "beta", "volatility_30d",
        ):
            val = getattr(metrics, field, None)
            if val is not None:
                row[field] = val
    for key, val in computed.items():
        if val is not None and key in {
            "revenue_growth", "eps_growth", "gross_margin", "operating_margin",
            "net_margin", "roe", "roa", "debt_to_equity", "current_ratio",
            "free_cash_flow", "volatility_30d",
        }:
            row[key] = val
    return row


async def refresh_company_data(
    db: AsyncSession,
    provider: BaseMarketDataProvider,
    ticker: str,
) -> dict[str, Any]:
    """Fetch, validate, normalize, upsert, score and cache one company.

    Returns a summary dict. Raises provider exceptions; callers map them.
    """
    ticker = ticker.upper()
    profile = await provider.get_profile(ticker)
    quote = await provider.get_quote(ticker)
    metrics = await provider.get_metrics(ticker)
    statements = await provider.get_financial_statements(ticker, "annual", limit=5)
    prices = await provider.get_price_history(ticker, "1y")

    company = await company_repository.upsert_company_profile(
        db,
        ticker=profile.ticker,
        name=profile.name,
        exchange=profile.exchange,
        sector=profile.sector,
        industry=profile.industry,
        description=profile.description,
        currency=profile.currency,
        country=profile.country,
    )

    # ---- calculated metrics + scoring -------------------------------------
    raw_metrics: dict[str, Any] = {}
    if metrics is not None:
        for field in (
            "pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda", "roe", "roa",
            "gross_margin", "operating_margin", "net_margin", "revenue",
            "revenue_growth", "net_income", "eps", "eps_growth",
            "debt_to_equity", "current_ratio", "free_cash_flow",
            "dividend_yield", "beta", "volatility_30d",
        ):
            val = getattr(metrics, field, None)
            if val is not None:
                raw_metrics[field] = val
    raw_metrics.update(
        compute_price_metrics(prices)
    )

    calculated = build_calculated_metrics(
        metrics=raw_metrics,
        statements=statements,
        prices=prices,
        market_cap=float(quote.market_cap) if quote.market_cap else None,
    )
    engine_inputs = _engine_inputs(raw_metrics, calculated)

    fundamental = compute_fundamental(engine_inputs)
    technical = compute_technical(engine_inputs)
    risk = compute_risk(engine_inputs)
    overall = compute_overall(
        fundamental.score, technical.score, risk.score,
        fundamental.confidence, technical.confidence, risk.confidence,
    )

    # ---- persist -------------------------------------------------------------
    now = datetime.now(timezone.utc)
    metrics_row = _metrics_dict(quote, metrics, calculated)
    metrics_row.update(
        {
            "fundamental_score": overall.fundamental,
            "technical_score": overall.technical,
            "risk_score": overall.risk,
            "overall_score": overall.score,
            "recommendation": overall.recommendation.lower(),
        }
    )
    await company_repository.upsert_metrics(
        db, company, metrics_row, data_as_of=now, source=provider.name
    )

    price_bars = [(p.trade_date, p.open, p.high, p.low, p.close, p.volume) for p in prices]
    await company_repository.upsert_prices(db, company, price_bars)

    await company_repository.delete_existing_statements(db, company.id, "annual")
    statement_rows = [
        _statement_orm(s) for s in statements
    ]
    await company_repository.upsert_statements(db, company, statement_rows)

    await company_repository.mark_synced(db, company, now=now)
    await db.commit()

    # ---- cache ---------------------------------------------------------------
    await cache_util.cache.set_json(cache_util.company_metrics_key(ticker), metrics_row,
                         ttl=cache_util.TTLS["metrics"])
    await cache_util.cache.set_json(cache_util.company_quote_key(ticker), quote.model_dump(mode="json"),
                         ttl=cache_util.TTLS["quote"])
    await cache_util.cache.set_json(cache_util.company_profile_key(ticker), profile.model_dump(mode="json"),
                         ttl=cache_util.TTLS["profile"])
    await cache_util.cache.set_json(
        cache_util.company_statements_key(ticker, "annual"),
        [s.model_dump(mode="json") for s in statements],
        ttl=cache_util.TTLS["statements"],
    )
    await cache_util.cache.set_json(
        cache_util.company_history_key(ticker, "1y"),
        [p.model_dump(mode="json") for p in prices],
        ttl=cache_util.TTLS["history"],
    )
    await cache_util.cache.delete(cache_util.company_analysis_key(ticker))

    return {
        "ticker": ticker,
        "data_as_of": now.isoformat(),
        "source": provider.name,
        "overall_score": overall.score,
        "recommendation": overall.recommendation,
    }


def _statement_orm(s: Any) -> Any:
    """Map a NormalizedFinancialStatements to a FinancialStatement ORM object."""
    from app.models.company import FinancialStatement

    return FinancialStatement(
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
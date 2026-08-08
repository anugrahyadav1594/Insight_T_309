"""Data access for the company aggregate (search + upsert of metrics/history)."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company, CompanyMetrics, CompanyPrice, FinancialStatement
from app.repositories.base import get_by_id
from app.schemas.company import CompanySearchHit


# ---------------------------------------------------------------------------
# Reads
# ---------------------------------------------------------------------------
async def get_company_by_ticker(session: AsyncSession, ticker: str) -> Company | None:
    result = await session.execute(
        select(Company)
        .where(Company.ticker == ticker.upper())
        .options(selectinload(Company.metrics), selectinload(Company.prices), selectinload(Company.statements))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_company_by_id(session: AsyncSession, company_id: uuid.UUID) -> Company | None:
    return await get_by_id(session, Company, company_id)


async def get_all(session: AsyncSession) -> list[Company]:
    result = await session.execute(select(Company))
    return list(result.scalars().all())


async def top_by_score(session: AsyncSession, limit: int = 20) -> list[Company]:
    """Return enabled companies ranked by their cached overall score (desc)."""
    result = await session.execute(
        select(Company)
        .join(CompanyMetrics, CompanyMetrics.company_id == Company.id)
        .where(Company.is_enabled.is_(True), CompanyMetrics.overall_score.is_not(None))
        .order_by(CompanyMetrics.overall_score.desc())
        .options(selectinload(Company.metrics))
        .limit(limit)
    )
    return list(result.scalars().all())


async def list_companies_with_prices(
    session: AsyncSession, max_bars: int = 300
) -> list[Company]:
    """Return enabled companies with their price history preloaded (for movers)."""
    result = await session.execute(
        select(Company)
        .where(Company.is_enabled.is_(True))
        .options(selectinload(Company.metrics), selectinload(Company.prices))
    )
    companies = list(result.scalars().all())
    # Trim each company's prices to the most recent max_bars (ascending).
    for c in companies:
        if c.prices:
            ordered = sorted(c.prices, key=lambda p: p.trade_date, reverse=True)[:max_bars]
            c.prices = list(reversed(ordered))
    return companies


async def get_metrics(session: AsyncSession, company_id: uuid.UUID) -> CompanyMetrics | None:
    result = await session.execute(
        select(CompanyMetrics).where(CompanyMetrics.company_id == company_id).limit(1)
    )
    return result.scalar_one_or_none()


async def get_prices(session: AsyncSession, company_id: uuid.UUID, limit: int = 260) -> list[CompanyPrice]:
    result = await session.execute(
        select(CompanyPrice)
        .where(CompanyPrice.company_id == company_id)
        .order_by(CompanyPrice.trade_date.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))


async def get_statements(
    session: AsyncSession, company_id: uuid.UUID, period: str = "annual"
) -> list[FinancialStatement]:
    result = await session.execute(
        select(FinancialStatement)
        .where(FinancialStatement.company_id == company_id, FinancialStatement.period_type == period)
        .order_by(FinancialStatement.fiscal_year.desc())
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Search (§7) — local DB only, pg_trgm GIN indexed, no FMP per keystroke
# ---------------------------------------------------------------------------
async def search_companies(
    session: AsyncSession,
    query: str,
    limit: int = 10,
    exchange: str | None = None,
) -> list[CompanySearchHit]:
    q = query.strip()
    if not q:
        return []
    upper = q.upper()

    def base_stmt():
        stmt = (
            select(Company, CompanyMetrics.market_cap)
            .outerjoin(CompanyMetrics, CompanyMetrics.company_id == Company.id)
            .where(Company.is_enabled.is_(True))
        )
        if exchange:
            stmt = stmt.where(Company.exchange == exchange.upper())
        return stmt

    results: list[tuple[Company, Decimal | None]] = []
    seen: set[uuid.UUID] = set()

    # 1. Exact ticker match.
    for c, mc in (await session.execute(base_stmt().where(Company.ticker == upper))).all():
        if c.id not in seen:
            results.append((c, mc))
            seen.add(c.id)
    if len(results) >= limit:
        return _to_hits(results)[:limit]

    # 2. Ticker prefix.
    for c, mc in (await session.execute(
        base_stmt().where(Company.ticker.like(f"{upper}%")).order_by(CompanyMetrics.market_cap.desc())
    )).all():
        if c.id not in seen:
            results.append((c, mc))
            seen.add(c.id)
    if len(results) >= limit:
        return _to_hits(results)[:limit]

    # 3. Name prefix.
    for c, mc in (await session.execute(
        base_stmt().where(Company.name.ilike(f"{q}%")).order_by(CompanyMetrics.market_cap.desc())
    )).all():
        if c.id not in seen:
            results.append((c, mc))
            seen.add(c.id)
    if len(results) >= limit:
        return _to_hits(results)[:limit]

    # 4. Name contains.
    for c, mc in (await session.execute(
        base_stmt().where(Company.name.ilike(f"%{q}%")).order_by(CompanyMetrics.market_cap.desc())
    )).all():
        if c.id not in seen:
            results.append((c, mc))
            seen.add(c.id)

    return _to_hits(results)[:limit]


def _to_hits(rows: list[tuple[Company, Decimal | None]]) -> list[CompanySearchHit]:
    return [
        CompanySearchHit(
            ticker=c.ticker,
            name=c.name,
            exchange=c.exchange,
            sector=c.sector,
            industry=c.industry,
            market_cap=mc,
        )
        for c, mc in rows
    ]


# ---------------------------------------------------------------------------
# Writes
# ---------------------------------------------------------------------------
async def upsert_company_profile(
    session: AsyncSession,
    *,
    ticker: str,
    name: str,
    exchange: str,
    sector: str | None,
    industry: str | None,
    description: str | None,
    currency: str,
    country: str | None,
) -> Company:
    company = await get_company_by_ticker(session, ticker)
    if company is None:
        company = Company(ticker=ticker.upper(), exchange=exchange)
        session.add(company)
    company.name = name
    company.sector = sector
    company.industry = industry
    company.description = description
    company.currency = currency
    company.country = country
    await session.flush()
    return company


async def upsert_metrics(
    session: AsyncSession,
    company: Company,
    metrics: dict[str, Any],
    *,
    data_as_of: datetime,
    source: str,
) -> CompanyMetrics:
    row = await get_metrics(session, company.id)
    if row is None:
        row = CompanyMetrics(company_id=company.id)
        session.add(row)
    for key, value in metrics.items():
        if hasattr(row, key):
            setattr(row, key, value)
    row.data_as_of = data_as_of
    row.source = source
    await session.flush()
    return row


async def upsert_prices(
    session: AsyncSession,
    company: Company,
    bars: list[tuple[date, Decimal, Decimal, Decimal, Decimal, int]],
) -> None:
    if not bars:
        return
    existing = {
        (p.trade_date): p
        for p in await get_prices(session, company.id, limit=100000)
    }
    for trade_date, open_, high, low, close, volume in bars:
        if trade_date in existing:
            p = existing[trade_date]
            p.open, p.high, p.low, p.close, p.volume = open_, high, low, close, volume
        else:
            session.add(CompanyPrice(
                company_id=company.id, trade_date=trade_date,
                open=open_, high=high, low=low, close=close, volume=volume,
            ))
    await session.flush()


async def upsert_statements(
    session: AsyncSession,
    company: Company,
    statements: list[FinancialStatement],
) -> None:
    for st in statements:
        st.company_id = company.id
        session.add(st)
    await session.flush()


async def delete_existing_statements(session: AsyncSession, company_id: uuid.UUID, period: str) -> None:
    from sqlalchemy import delete

    await session.execute(
        delete(FinancialStatement).where(
            FinancialStatement.company_id == company_id,
            FinancialStatement.period_type == period,
        )
    )


async def mark_synced(session: AsyncSession, company: Company, *, now: datetime | None = None) -> None:
    company.data_status = "synced"
    company.last_synced_at = now or datetime.now(timezone.utc)
    await session.flush()
"""Data access for ``portfolios`` and ``portfolio_holdings``."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.portfolio import Portfolio, PortfolioHolding
from app.repositories.base import commit_refresh, get_by_id


# -- portfolios ---------------------------------------------------------------
async def list_user_portfolios(session: AsyncSession, user_id: uuid.UUID) -> list[Portfolio]:
    result = await session.execute(
        select(Portfolio)
        .where(Portfolio.user_id == user_id)
        .options(selectinload(Portfolio.holdings))
        .order_by(Portfolio.created_at.desc())
    )
    return list(result.scalars().all())


async def get_portfolio(session: AsyncSession, portfolio_id: uuid.UUID) -> Portfolio | None:
    return await get_by_id(session, Portfolio, portfolio_id)


async def get_portfolio_with_holdings(session: AsyncSession, portfolio_id: uuid.UUID) -> Portfolio | None:
    result = await session.execute(
        select(Portfolio)
        .where(Portfolio.id == portfolio_id)
        .options(selectinload(Portfolio.holdings))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def create_portfolio(
    session: AsyncSession, *, user_id: uuid.UUID, name: str, description: str | None
) -> Portfolio:
    portfolio = Portfolio(user_id=user_id, name=name, description=description)
    session.add(portfolio)
    return await commit_refresh(session, portfolio)


# -- holdings ------------------------------------------------------------------
async def get_holding(session: AsyncSession, holding_id: uuid.UUID) -> PortfolioHolding | None:
    return await get_by_id(session, PortfolioHolding, holding_id)


async def get_holding_by_company(
    session: AsyncSession, portfolio_id: uuid.UUID, company_id: uuid.UUID
) -> PortfolioHolding | None:
    result = await session.execute(
        select(PortfolioHolding)
        .where(PortfolioHolding.portfolio_id == portfolio_id, PortfolioHolding.company_id == company_id)
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_holdings(session: AsyncSession, portfolio_id: uuid.UUID) -> list[PortfolioHolding]:
    result = await session.execute(
        select(PortfolioHolding).where(PortfolioHolding.portfolio_id == portfolio_id)
    )
    return list(result.scalars().all())


async def add_holding(
    session: AsyncSession,
    *,
    portfolio_id: uuid.UUID,
    company_id: uuid.UUID,
    quantity: Decimal,
    average_buy_price: Decimal,
) -> PortfolioHolding:
    holding = PortfolioHolding(
        portfolio_id=portfolio_id,
        company_id=company_id,
        quantity=quantity,
        average_buy_price=average_buy_price,
    )
    session.add(holding)
    await session.flush()
    return holding


async def update_holding(
    session: AsyncSession,
    holding: PortfolioHolding,
    *,
    quantity: Decimal | None,
    average_buy_price: Decimal | None,
) -> PortfolioHolding:
    if quantity is not None:
        holding.quantity = quantity
    if average_buy_price is not None:
        holding.average_buy_price = average_buy_price
    await session.flush()
    return holding


async def delete_holding(session: AsyncSession, holding: PortfolioHolding) -> None:
    await session.delete(holding)
    await session.commit()
"""ORM models: ``portfolios`` and ``portfolio_holdings``."""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.company import MONEY

QUANTITY = Numeric(18, 4)


class Portfolio(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """User portfolio container (§4.9)."""

    __tablename__ = "portfolios"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    holdings: Mapped[list["PortfolioHolding"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan", lazy="selectin"
    )


class PortfolioHolding(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One (portfolio, company) holding with quantity and average buy price (§4.10)."""

    __tablename__ = "portfolio_holdings"
    __table_args__ = (
        UniqueConstraint("portfolio_id", "company_id", name="uq_portfolio_holdings_portfolio_company"),
        CheckConstraint("quantity > 0", name="ck_portfolio_holdings_quantity_positive"),
        CheckConstraint("average_buy_price > 0", name="ck_portfolio_holdings_buy_price_positive"),
    )

    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(QUANTITY, nullable=False)
    average_buy_price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)

    portfolio: Mapped[Portfolio] = relationship(back_populates="holdings")
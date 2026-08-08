"""ORM models for the company aggregate: ``companies``, ``company_metrics``,
``company_prices`` and ``financial_statements``."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

# Native PostgreSQL enums (declared here so the migration matches the models).
period_type_enum = Enum(
    "annual",
    "quarterly",
    name="period_type",
    native_enum=True,
    create_constraint=True,
)

recommendation_enum = Enum(
    "strong_buy",
    "buy",
    "hold",
    "neutral",
    "bearish",
    name="recommendation",
    native_enum=True,
    create_constraint=True,
)

MONEY = Numeric(18, 2)
LARGE_MONEY = Numeric(24, 2)
RATIO = Numeric(12, 4)
PERCENT = Numeric(10, 4)


class Company(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Master registry of companies (§4.5)."""

    __tablename__ = "companies"
    __table_args__ = (
        UniqueConstraint("ticker", "exchange", name="uq_companies_ticker_exchange"),
        Index("ix_companies_ticker_trgm", "ticker", postgresql_using="gin",
              postgresql_ops={"ticker": "gin_trgm_ops"}),
        Index("ix_companies_name_trgm", "name", postgresql_using="gin",
              postgresql_ops={"name": "gin_trgm_ops"}),
        Index("ix_companies_sector", "sector"),
        Index("ix_companies_exchange", "exchange"),
    )

    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    exchange: Mapped[str] = mapped_column(String(16), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(64), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="INR", server_default="INR")
    country: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    data_status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="seeded", server_default="seeded"
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    metrics: Mapped["CompanyMetrics | None"] = relationship(
        back_populates="company", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    prices: Mapped[list["CompanyPrice"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", lazy="selectin"
    )
    statements: Mapped[list["FinancialStatement"]] = relationship(
        back_populates="company", cascade="all, delete-orphan", lazy="selectin"
    )


class CompanyMetrics(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Current normalized snapshot — one row per company (§4.6)."""

    __tablename__ = "company_metrics"
    __table_args__ = (
        UniqueConstraint("company_id", name="uq_company_metrics_company_id"),
        Index("ix_company_metrics_roe", "roe"),
        Index("ix_company_metrics_revenue_growth", "revenue_growth"),
        Index("ix_company_metrics_debt_to_equity", "debt_to_equity"),
        Index("ix_company_metrics_pe_ratio", "pe_ratio"),
        Index("ix_company_metrics_market_cap", "market_cap"),
        Index("ix_company_metrics_overall_score", "overall_score"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    price: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    previous_close: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    day_change: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    day_change_pct: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    avg_volume: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    market_cap: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    pe_ratio: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    pb_ratio: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    ps_ratio: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    ev_ebitda: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    roe: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    roa: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    gross_margin: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    operating_margin: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    net_margin: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    revenue: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    revenue_growth: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    net_income: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    eps: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    eps_growth: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    debt_to_equity: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    current_ratio: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    free_cash_flow: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    dividend_yield: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    beta: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    high_52w: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    low_52w: Mapped[Decimal | None] = mapped_column(MONEY, nullable=True)
    volatility_30d: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)

    fundamental_score: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    technical_score: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    risk_score: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    overall_score: Mapped[Decimal | None] = mapped_column(PERCENT, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(recommendation_enum, nullable=True)

    data_as_of: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="seed", server_default="seed")

    company: Mapped[Company] = relationship(back_populates="metrics")


class CompanyPrice(UUIDPrimaryKeyMixin, Base):
    """Daily OHLCV history (§4.7)."""

    __tablename__ = "company_prices"
    __table_args__ = (
        UniqueConstraint("company_id", "trade_date", name="uq_company_prices_company_date"),
        Index("ix_company_prices_company_date_desc", "company_id", text("trade_date DESC")),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    trade_date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    high: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    low: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    close: Mapped[Decimal] = mapped_column(MONEY, nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0, server_default="0")

    company: Mapped[Company] = relationship(back_populates="prices")


class FinancialStatement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Annual/quarterly financial statement line items (§4.8)."""

    __tablename__ = "financial_statements"
    __table_args__ = (
        UniqueConstraint(
            "company_id", "period_type", "fiscal_year", "fiscal_quarter",
            name="uq_financial_statements_period",
        ),
        Index(
            "ix_financial_statements_company_period",
            "company_id", "period_type", text("fiscal_year DESC"),
        ),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    period_type: Mapped[str] = mapped_column(period_type_enum, nullable=False)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    fiscal_quarter: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="INR", server_default="INR")
    revenue: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    gross_profit: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    operating_income: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    net_income: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    total_assets: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    total_liabilities: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    total_equity: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    total_debt: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    cash_and_equivalents: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    operating_cash_flow: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    capex: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    free_cash_flow: Mapped[Decimal | None] = mapped_column(LARGE_MONEY, nullable=True)
    eps: Mapped[Decimal | None] = mapped_column(RATIO, nullable=True)
    diluted_shares: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    company: Mapped[Company] = relationship(back_populates="statements")
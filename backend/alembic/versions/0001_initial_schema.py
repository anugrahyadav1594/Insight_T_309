"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-08

Creates the pg_trgm extension, native enums and all 15 tables per ARCHITECTURE.md §4.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

MONEY = sa.Numeric(18, 2)
LARGE_MONEY = sa.Numeric(24, 2)
RATIO = sa.Numeric(12, 4)
PERCENT = sa.Numeric(10, 4)
QUANTITY = sa.Numeric(18, 4)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Create each native enum exactly once, then reference a create_type=False
    # variant in the table definitions so op.create_table does NOT try to
    # re-create the type (which would raise "already exists").
    _pt = postgresql.ENUM("annual", "quarterly", name="period_type")
    _rec = postgresql.ENUM("strong_buy", "buy", "hold", "neutral", "bearish", name="recommendation")
    _rt = postgresql.ENUM("company_analysis", "portfolio_analysis", name="report_type")
    _role = postgresql.ENUM("user", "assistant", "system", name="role")
    for enum in (_pt, _rec, _rt, _role):
        enum.create(op.get_bind(), checkfirst=True)

    period_type = postgresql.ENUM("annual", "quarterly", name="period_type", create_type=False)
    recommendation = postgresql.ENUM(
        "strong_buy", "buy", "hold", "neutral", "bearish", name="recommendation", create_type=False
    )
    report_type = postgresql.ENUM(
        "company_analysis", "portfolio_analysis", name="report_type", create_type=False
    )
    role = postgresql.ENUM("user", "assistant", "system", name="role", create_type=False)

    # -- users -----------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_login_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    # -- refresh_tokens ----------------------------------------------------------
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expires_at", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("revoked_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.UniqueConstraint("token_hash", name="uq_refresh_tokens_token_hash"),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_family_id", "refresh_tokens", ["family_id"])
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])

    # -- companies ---------------------------------------------------------------
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("ticker", sa.String(20), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("exchange", sa.String(16), nullable=False),
        sa.Column("sector", sa.String(64), nullable=True),
        sa.Column("industry", sa.String(64), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("country", sa.String(64), nullable=True),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("data_status", sa.String(16), nullable=False, server_default="seeded"),
        sa.Column("last_synced_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint("ticker", "exchange", name="uq_companies_ticker_exchange"),
    )
    op.create_index("ix_companies_sector", "companies", ["sector"])
    op.create_index("ix_companies_exchange", "companies", ["exchange"])
    op.execute(
        "CREATE INDEX ix_companies_ticker_trgm ON companies USING gin (ticker gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX ix_companies_name_trgm ON companies USING gin (name gin_trgm_ops)"
    )

    # -- company_metrics ----------------------------------------------------------
    op.create_table(
        "company_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("price", MONEY, nullable=False),
        sa.Column("previous_close", MONEY, nullable=True),
        sa.Column("day_change", PERCENT, nullable=True),
        sa.Column("day_change_pct", PERCENT, nullable=True),
        sa.Column("volume", sa.BigInteger(), nullable=True),
        sa.Column("avg_volume", sa.BigInteger(), nullable=True),
        sa.Column("market_cap", LARGE_MONEY, nullable=True),
        sa.Column("pe_ratio", RATIO, nullable=True),
        sa.Column("pb_ratio", RATIO, nullable=True),
        sa.Column("ps_ratio", RATIO, nullable=True),
        sa.Column("ev_ebitda", RATIO, nullable=True),
        sa.Column("roe", PERCENT, nullable=True),
        sa.Column("roa", PERCENT, nullable=True),
        sa.Column("gross_margin", PERCENT, nullable=True),
        sa.Column("operating_margin", PERCENT, nullable=True),
        sa.Column("net_margin", PERCENT, nullable=True),
        sa.Column("revenue", LARGE_MONEY, nullable=True),
        sa.Column("revenue_growth", PERCENT, nullable=True),
        sa.Column("net_income", LARGE_MONEY, nullable=True),
        sa.Column("eps", RATIO, nullable=True),
        sa.Column("eps_growth", PERCENT, nullable=True),
        sa.Column("debt_to_equity", RATIO, nullable=True),
        sa.Column("current_ratio", RATIO, nullable=True),
        sa.Column("free_cash_flow", LARGE_MONEY, nullable=True),
        sa.Column("dividend_yield", PERCENT, nullable=True),
        sa.Column("beta", PERCENT, nullable=True),
        sa.Column("high_52w", MONEY, nullable=True),
        sa.Column("low_52w", MONEY, nullable=True),
        sa.Column("volatility_30d", PERCENT, nullable=True),
        sa.Column("fundamental_score", PERCENT, nullable=True),
        sa.Column("technical_score", PERCENT, nullable=True),
        sa.Column("risk_score", PERCENT, nullable=True),
        sa.Column("overall_score", PERCENT, nullable=True),
        sa.Column("recommendation", recommendation, nullable=True),
        sa.Column("data_as_of", postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("source", sa.String(16), nullable=False, server_default="seed"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint("company_id", name="uq_company_metrics_company_id"),
    )
    for col in ("roe", "revenue_growth", "debt_to_equity", "pe_ratio", "market_cap", "overall_score"):
        op.create_index(f"ix_company_metrics_{col}", "company_metrics", [col])

    # -- company_prices ------------------------------------------------------------
    op.create_table(
        "company_prices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trade_date", sa.Date(), nullable=False),
        sa.Column("open", MONEY, nullable=False),
        sa.Column("high", MONEY, nullable=False),
        sa.Column("low", MONEY, nullable=False),
        sa.Column("close", MONEY, nullable=False),
        sa.Column("volume", sa.BigInteger(), nullable=False, server_default="0"),
        sa.UniqueConstraint("company_id", "trade_date", name="uq_company_prices_company_date"),
    )
    op.create_index("ix_company_prices_company_date_desc", "company_prices",
                    ["company_id", sa.text("trade_date DESC")])

    # -- financial_statements ------------------------------------------------------
    op.create_table(
        "financial_statements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("period_type", period_type, nullable=False),
        sa.Column("fiscal_year", sa.Integer(), nullable=False),
        sa.Column("fiscal_quarter", sa.Integer(), nullable=True),
        sa.Column("currency", sa.String(8), nullable=False, server_default="INR"),
        sa.Column("revenue", LARGE_MONEY, nullable=True),
        sa.Column("gross_profit", LARGE_MONEY, nullable=True),
        sa.Column("operating_income", LARGE_MONEY, nullable=True),
        sa.Column("net_income", LARGE_MONEY, nullable=True),
        sa.Column("total_assets", LARGE_MONEY, nullable=True),
        sa.Column("total_liabilities", LARGE_MONEY, nullable=True),
        sa.Column("total_equity", LARGE_MONEY, nullable=True),
        sa.Column("total_debt", LARGE_MONEY, nullable=True),
        sa.Column("cash_and_equivalents", LARGE_MONEY, nullable=True),
        sa.Column("operating_cash_flow", LARGE_MONEY, nullable=True),
        sa.Column("capex", LARGE_MONEY, nullable=True),
        sa.Column("free_cash_flow", LARGE_MONEY, nullable=True),
        sa.Column("eps", RATIO, nullable=True),
        sa.Column("diluted_shares", sa.BigInteger(), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint(
            "company_id", "period_type", "fiscal_year", "fiscal_quarter",
            name="uq_financial_statements_period",
        ),
    )
    op.create_index("ix_financial_statements_company_period", "financial_statements",
                    ["company_id", "period_type", sa.text("fiscal_year DESC")])

    # -- portfolios ----------------------------------------------------------------
    op.create_table(
        "portfolios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_portfolios_user_id", "portfolios", ["user_id"])

    # -- portfolio_holdings ----------------------------------------------------------
    op.create_table(
        "portfolio_holdings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("portfolio_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", QUANTITY, nullable=False),
        sa.Column("average_buy_price", MONEY, nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint("portfolio_id", "company_id",
                            name="uq_portfolio_holdings_portfolio_company"),
        sa.CheckConstraint("quantity > 0", name="ck_portfolio_holdings_quantity_positive"),
        sa.CheckConstraint("average_buy_price > 0", name="ck_portfolio_holdings_buy_price_positive"),
    )
    op.create_index("ix_portfolio_holdings_portfolio_id", "portfolio_holdings", ["portfolio_id"])

    # -- watchlists / watchlist_items -------------------------------------------------
    op.create_table(
        "watchlists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("name", sa.String(100), nullable=False, server_default="Watchlist"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_watchlists_user_id", "watchlists", ["user_id"])

    op.create_table(
        "watchlist_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("watchlist_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("added_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint("watchlist_id", "company_id", name="uq_watchlist_items_watchlist_company"),
    )
    op.create_index("ix_watchlist_items_watchlist_id", "watchlist_items", ["watchlist_id"])
    op.create_index("ix_watchlist_items_company_id", "watchlist_items", ["company_id"])

    # -- ai_conversations / ai_messages / ai_reports --------------------------------
    op.create_table(
        "ai_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_ai_conversations_user_updated", "ai_conversations",
                    ["user_id", sa.text("updated_at DESC")])

    op.create_table(
        "ai_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", role, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("context_snapshot", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_ai_messages_conversation_id", "ai_messages", ["conversation_id"])
    op.create_index("ix_ai_messages_conversation_created", "ai_messages",
                    ["conversation_id", "created_at"])

    op.create_table(
        "ai_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("portfolio_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("portfolios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("report_type", report_type, nullable=False),
        sa.Column("recommendation", recommendation, nullable=True),
        sa.Column("confidence", sa.Numeric(6, 4), nullable=True),
        sa.Column("scores_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("explanation", postgresql.JSONB(), nullable=True),
        sa.Column("raw_response", postgresql.JSONB(), nullable=True),
        sa.Column("model", sa.String(64), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_ai_reports_user_id", "ai_reports", ["user_id"])

    # -- screening_queries / screening_results ---------------------------------------
    op.create_table(
        "screening_queries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("natural_language", sa.Text(), nullable=True),
        sa.Column("structured_filter", postgresql.JSONB(), nullable=False),
        sa.Column("result_count", sa.Integer(), nullable=True),
        sa.Column("execution_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_screening_queries_user_id", "screening_queries", ["user_id"])
    op.create_index("ix_screening_queries_user_created", "screening_queries",
                    ["user_id", sa.text("created_at DESC")])

    op.create_table(
        "screening_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("screening_query_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("screening_queries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("fundamental_score", PERCENT, nullable=False),
        sa.Column("technical_score", PERCENT, nullable=False),
        sa.Column("risk_score", PERCENT, nullable=False),
        sa.Column("overall_score", PERCENT, nullable=False),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.UniqueConstraint("screening_query_id", "company_id",
                            name="uq_screening_results_query_company"),
    )
    op.create_index("ix_screening_results_query_rank", "screening_results",
                    ["screening_query_id", "rank"])


def downgrade() -> None:
    op.drop_table("screening_results")
    op.drop_table("screening_queries")
    op.drop_table("ai_reports")
    op.drop_table("ai_messages")
    op.drop_table("ai_conversations")
    op.drop_table("watchlist_items")
    op.drop_table("watchlists")
    op.drop_table("portfolio_holdings")
    op.drop_table("portfolios")
    op.drop_table("financial_statements")
    op.drop_table("company_prices")
    op.drop_table("company_metrics")
    op.drop_table("companies")
    op.drop_table("refresh_tokens")
    op.drop_table("users")

    postgresql.ENUM(name="role").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="report_type").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="recommendation").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="period_type").drop(op.get_bind(), checkfirst=True)
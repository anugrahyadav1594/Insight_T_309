"""ipo calendar table

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-08

Adds the ``ipos`` table for the IPO listing feature (ongoing/upcoming/ended).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

MONEY = sa.Numeric(18, 2)


def upgrade() -> None:
    op.create_table(
        "ipos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("ticker", sa.String(20), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("exchange", sa.String(16), nullable=False, server_default="NSE"),
        sa.Column("sector", sa.String(64), nullable=True),
        sa.Column("price_band_low", MONEY, nullable=True),
        sa.Column("price_band_high", MONEY, nullable=True),
        sa.Column("issue_size", MONEY, nullable=True),
        sa.Column("open_date", sa.Date(), nullable=True),
        sa.Column("close_date", sa.Date(), nullable=True),
        sa.Column("listing_date", sa.Date(), nullable=True),
        sa.Column("allotment_date", sa.Date(), nullable=True),
        sa.Column("listing_open", MONEY, nullable=True),
        sa.Column("listing_close", MONEY, nullable=True),
        sa.Column("listing_gain_pct", sa.Numeric(10, 4), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source", sa.String(16), nullable=False, server_default="seed"),
        sa.Column("created_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", postgresql.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )
    op.create_index("ix_ipos_listing_date", "ipos", ["listing_date"])
    op.create_index("ix_ipos_open_date", "ipos", ["open_date"])


def downgrade() -> None:
    op.drop_table("ipos")
"""Unit tests for the pure metrics engine (§8.4)."""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

import pytest

from app.engines.metrics_engine import (
    build_calculated_metrics,
    compute_price_metrics,
    compute_statement_metrics,
    max_drawdown,
    rsi14,
)
from app.integrations.market_data.schemas import (
    NormalizedFinancialStatements,
    NormalizedPriceBar,
)


def _bars():
    start = date.today() - timedelta(days=60)
    bars = []
    price = 100.0
    for i in range(60):
        price *= 1.005 if i < 30 else 1.01
        bars.append(
            NormalizedPriceBar(
                ticker="TCS", trade_date=start + timedelta(days=i),
                open=Decimal(str(round(price, 2))),
                high=Decimal(str(round(price * 1.01, 2))),
                low=Decimal(str(round(price * 0.99, 2))),
                close=Decimal(str(round(price, 2))),
                volume=1_000_000 + i * 1000,
            )
        )
    return bars


def test_price_metrics_derived():
    bars = _bars()
    m = compute_price_metrics(bars, current_price=None)
    # Rising price series -> positive price-vs-MA.
    assert m["price_vs_ma50"] > 0
    assert "position_52w" in m
    assert "volume_ratio" in m
    assert m["max_drawdown"] <= 0


def test_statement_metrics():
    statements = [
        NormalizedFinancialStatements(
            ticker="TCS", period_type="annual", fiscal_year=2025,
            revenue=Decimal("100"), gross_profit=Decimal("46"), operating_income=Decimal("25"),
            net_income=Decimal("21"), total_assets=Decimal("200"), total_liabilities=Decimal("100"),
            total_equity=Decimal("100"), total_debt=Decimal("9"),
            operating_cash_flow=Decimal("20"), capex=Decimal("3"), free_cash_flow=Decimal("17"),
            eps=Decimal("10"), current_assets=Decimal("80"), current_liabilities=Decimal("40"),
        ),
        NormalizedFinancialStatements(
            ticker="TCS", period_type="annual", fiscal_year=2024,
            revenue=Decimal("91"), net_income=Decimal("18"), total_assets=Decimal("180"),
            total_equity=Decimal("90"), eps=Decimal("9"),
        ),
    ]
    m = compute_statement_metrics(statements)
    assert m["gross_margin"] == pytest.approx(46.0)
    assert m["net_margin"] == pytest.approx(21.0)
    assert m["roe"] == pytest.approx(21.0)
    assert m["current_ratio"] == pytest.approx(2.0)
    assert m["debt_to_equity"] == pytest.approx(0.09)
    assert m["revenue_growth"] == pytest.approx((100 - 91) / 91 * 100, abs=0.01)


def test_build_calculated_metrics_fcf_yield():
    statements = [
        NormalizedFinancialStatements(
            ticker="TCS", period_type="annual", fiscal_year=2025,
            revenue=Decimal("100"), net_income=Decimal("21"), total_equity=Decimal("100"),
            free_cash_flow=Decimal("17"),
        )
    ]
    calc = build_calculated_metrics(statements=statements, market_cap=100.0)
    assert calc["free_cash_flow"] == pytest.approx(17.0)
    assert calc["fcf_yield"] == pytest.approx(17.0)


def test_rsi_returns_100_on_no_losses():
    values = [100 + i for i in range(20)]
    assert rsi14(values) == 100.0


def test_max_drawdown():
    values = [100, 110, 90, 95, 80, 120]
    assert max_drawdown(values) == pytest.approx(-27.27, abs=0.1)
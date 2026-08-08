"""Unit tests for portfolio math (§24.2)."""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.engines.portfolio_engine import (
    compute_holding_math,
    compute_portfolio_summary,
    compute_sector_concentration,
    compute_weighted_scores,
    risk_health_label,
)


def test_holding_math():
    m = compute_holding_math(Decimal("100"), Decimal("3400"), Decimal("3725.50"))
    assert m["invested_value"] == pytest.approx(340000.0)
    assert m["current_value"] == pytest.approx(372550.0)
    assert m["pnl"] == pytest.approx(32550.0)
    assert m["pnl_pct"] == pytest.approx(9.5735, abs=0.01)


def test_holding_math_no_current_price_uses_buy():
    m = compute_holding_math(Decimal("10"), Decimal("100"), None)
    assert m["invested_value"] == pytest.approx(1000.0)
    assert m["current_value"] == pytest.approx(1000.0)
    assert m["pnl"] == pytest.approx(0.0)


def test_portfolio_summary():
    holdings = [
        {"invested_value": 1000.0, "current_value": 1200.0},
        {"invested_value": 2000.0, "current_value": 1800.0},
    ]
    s = compute_portfolio_summary(holdings)
    assert s["total_invested"] == pytest.approx(3000.0)
    assert s["total_value"] == pytest.approx(3000.0)
    assert s["total_pl"] == pytest.approx(0.0)
    assert s["holdings_count"] == 2


def test_sector_concentration():
    holdings = [
        {"sector": "Technology", "current_value": 600.0},
        {"sector": "Technology", "current_value": 300.0},
        {"sector": "Energy", "current_value": 100.0},
    ]
    conc = compute_sector_concentration(holdings)
    assert conc[0]["sector"] == "Technology"
    assert conc[0]["weight"] == pytest.approx(90.0)
    assert conc[1]["weight"] == pytest.approx(10.0)


def test_weighted_scores():
    holdings = [
        {"ticker": "TCS", "current_value": 600.0, "overall_score": 80.0,
         "fundamental_score": 80.0, "technical_score": 70.0, "risk_score": 60.0},
        {"ticker": "INFY", "current_value": 400.0, "overall_score": 60.0,
         "fundamental_score": 60.0, "technical_score": 50.0, "risk_score": 40.0},
    ]
    s = compute_weighted_scores(holdings)
    # Overall: (600*80 + 400*60)/1000 = 72.0
    assert s["overall"] == pytest.approx(72.0)
    assert s["confidence"] == pytest.approx(1.0)


def test_weighted_scores_missing_holding():
    holdings = [
        {"ticker": "TCS", "current_value": 600.0, "overall_score": 80.0},
        {"ticker": "X", "current_value": 400.0},  # no score -> zero weight
    ]
    s = compute_weighted_scores(holdings)
    assert s["overall"] == pytest.approx(80.0)
    assert s["confidence"] == pytest.approx(0.6)


def test_weighted_scores_empty():
    s = compute_weighted_scores([])
    assert s["overall"] is None
    assert s["confidence"] == 0.0


def test_risk_health_labels():
    assert risk_health_label(85) == "LOW"
    assert risk_health_label(65) == "MODERATE"
    assert risk_health_label(45) == "ELEVATED"
    assert risk_health_label(20) == "HIGH"
    assert risk_health_label(None) == "UNKNOWN"
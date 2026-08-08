"""Unit tests for the deterministic scoring engines (§24.2)."""

from __future__ import annotations

import pytest

from app.engines.fundamental_engine import compute_fundamental
from app.engines.technical_engine import compute_technical
from app.engines.risk_engine import compute_risk
from app.engines.overall_engine import compute_overall

STRONG_METRICS = {
    "roe": 27.4, "roa": 18.0, "net_margin": 21.0, "operating_margin": 25.0,
    "gross_margin": 46.0, "current_ratio": 2.4, "quick_ratio": 2.0,
    "interest_coverage": 30.0, "debt_to_equity": 0.09, "revenue_growth": 8.9,
    "eps_growth": 12.1, "fcf_yield": 3.0,
    "price_vs_ma20": 3.0, "price_vs_ma50": 5.0, "price_vs_ma200": 12.0,
    "ma50_slope": 4.0, "rsi_14": 62.0, "momentum_3m": 11.0, "position_52w": 80.0,
    "volume_ratio": 1.15,
    "eps_volatility": 15.0, "revenue_volatility": 12.0, "beta": 0.9,
    "max_drawdown": -18.0, "market_cap": 1.35e12, "share_liquidity": 3e6,
}


def test_fundamental_formula_and_breakdown():
    f = compute_fundamental(STRONG_METRICS)
    assert f.breakdown["profitability"] > 50
    expected = (
        0.40 * f.breakdown["profitability"]
        + 0.30 * f.breakdown["liquidity"]
        + 0.30 * f.breakdown["efficiency"]
    )
    assert f.score == pytest.approx(expected, abs=0.2)


def test_technical_weights():
    t = compute_technical(STRONG_METRICS)
    expected = (
        0.40 * t.breakdown["trend"]
        + 0.40 * t.breakdown["momentum"]
        + 0.20 * t.breakdown["volume_confirmation"]
    )
    assert t.score == pytest.approx(expected, abs=0.2)


def test_risk_weights():
    r = compute_risk(STRONG_METRICS)
    expected = (
        0.40 * r.breakdown["financial_risk"]
        + 0.30 * r.breakdown["earnings_stability"]
        + 0.20 * r.breakdown["market_risk"]
        + 0.10 * r.breakdown["size_factor"]
    )
    assert r.score == pytest.approx(expected, abs=0.2)


def test_overall_weighted_combination():
    f = compute_fundamental(STRONG_METRICS)
    t = compute_technical(STRONG_METRICS)
    r = compute_risk(STRONG_METRICS)
    o = compute_overall(f.score, t.score, r.score, f.confidence, t.confidence, r.confidence)
    expected = 0.50 * f.score + 0.20 * t.score + 0.30 * r.score
    assert o.score == pytest.approx(expected, abs=0.2)
    assert 0 <= o.confidence <= 1


def test_determinism_same_input_same_output():
    f1 = compute_fundamental(STRONG_METRICS)
    f2 = compute_fundamental(STRONG_METRICS)
    assert f1.model_dump() == f2.model_dump()


def test_missing_data_neutral_and_redistribution():
    # Only ROE provided -> profitability uses neutral 50 for the rest and
    # redistributes, so score is not 0 and not crashed.
    f = compute_fundamental({"roe": 27.4})
    assert 0 <= f.score <= 100
    assert f.confidence < 1.0
    assert f.warnings  # partial-data warnings present


def test_empty_payload_neutral():
    assert compute_fundamental({}).score == 50.0
    assert compute_technical({}).score == 50.0
    assert compute_risk({}).score == 50.0


def test_worked_example_consistency():
    # TCS-like illustrative inputs (doc §9.8): the recommendation must always
    # equal the deterministic band of the computed overall score.
    f = compute_fundamental(STRONG_METRICS)
    t = compute_technical(STRONG_METRICS)
    r = compute_risk(STRONG_METRICS)
    o = compute_overall(f.score, t.score, r.score)
    from app.engines.recommendation import recommend

    assert o.recommendation == recommend(o.score)
    assert 0 <= o.score <= 100
"""Unit tests for the movers (gainers/losers) engine."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.engines.movers_engine import (
    PERIOD_LOOKBACK_DAYS,
    compute_movers,
    normalize_period,
    period_return,
)


def _series(base: float, growth: float, n: int = 80):
    out = []
    p = base
    d = date(2025, 1, 1)
    for i in range(n):
        p *= growth
        out.append((d + timedelta(days=i), p))
    return out


def test_normalize_period():
    assert normalize_period("3m") == "3M"
    assert normalize_period("1D") == "1D"
    assert normalize_period(None) == "1D"
    assert normalize_period("bogus") == "1D"


def test_lookback_days():
    assert PERIOD_LOOKBACK_DAYS["1D"] == 1
    assert PERIOD_LOOKBACK_DAYS["1M"] == 21
    assert PERIOD_LOOKBACK_DAYS["3M"] == 63
    assert PERIOD_LOOKBACK_DAYS["1Y"] == 252


def test_period_return():
    prices = [(date(2025, 1, 1), 100.0), (date(2025, 1, 2), 110.0)]
    pct, current, start = period_return(prices, 1)
    assert pct == pytest.approx(10.0)
    assert current == 110.0
    assert start == 100.0


def test_period_return_insufficient_history():
    prices = [(date(2025, 1, 1), 100.0)]
    pct, current, start = period_return(prices, 5)
    # Clamped to first bar -> 0% return over single point.
    assert pct == pytest.approx(0.0)
    assert current == 100.0


def test_compute_movers_gainers_and_losers():
    data = {
        "GAINER": {"name": "Gainer", "exchange": "NSE", "sector": "Tech", "prices": _series(100, 1.01)},
        "LOSER": {"name": "Loser", "exchange": "NSE", "sector": "Energy", "prices": _series(100, 0.99)},
    }
    gainers = compute_movers(data, "1M", "gainers", 5)
    losers = compute_movers(data, "1M", "losers", 5)
    assert gainers[0].ticker == "GAINER"
    assert gainers[0].change_pct > 0
    assert losers[0].ticker == "LOSER"
    assert losers[0].change_pct < 0


def test_compute_movers_all_direction():
    data = {
        "GAINER": {"name": "Gainer", "exchange": "NSE", "sector": "Tech", "prices": _series(100, 1.01)},
        "LOSER": {"name": "Loser", "exchange": "NSE", "sector": "Energy", "prices": _series(100, 0.99)},
    }
    all_movers = compute_movers(data, "3M", "all", 5)
    assert len(all_movers) == 2
    directions = {m.ticker: m.direction for m in all_movers}
    assert directions["GAINER"] == "gainers"
    assert directions["LOSER"] == "losers"


def test_compute_movers_limit_and_sort():
    data = {
        f"T{i}": {"name": f"C{i}", "exchange": "NSE", "sector": None,
                  "prices": _series(100, 1.0 + 0.01 * (i + 1))}
        for i in range(5)
    }
    top3 = compute_movers(data, "1M", "gainers", 3)
    assert len(top3) == 3
    # Sorted descending by absolute change.
    pcts = [m.change_pct for m in top3]
    assert pcts == sorted(pcts, reverse=True)
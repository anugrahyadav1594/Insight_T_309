"""Unit tests for piecewise-linear normalizers (§24.2)."""

from __future__ import annotations

import pytest

from app.engines.normalizers import DEBT_TO_EQUITY, ROE, normalize


def test_linear_interpolation():
    # ROE 25 -> 80, ROE 30 -> 95 (breakpoints).
    assert ROE(25) == pytest.approx(80.0)
    assert ROE(30) == pytest.approx(95.0)
    # Midpoint between 25 and 30.
    assert ROE(27.5) == pytest.approx(80.0 + 2.5 / 5 * 15)


def test_clamping():
    assert ROE(-100) == 30.0   # below first breakpoint clamps to first output
    assert ROE(10000) == 100.0  # above last breakpoint clamps to last output


def test_lower_is_better_direction():
    # Debt/equity is "lower is better" -> descending table.
    assert DEBT_TO_EQUITY(0.0) == 100.0
    assert DEBT_TO_EQUITY(1.0) == 50.0
    assert DEBT_TO_EQUITY(10.0) == 5.0
    assert DEBT_TO_EQUITY(0.5) > DEBT_TO_EQUITY(2.0)


def test_none_passthrough():
    assert ROE(None) is None
    assert normalize("roe", None) is None
    assert normalize("does_not_exist", 5) is None


def test_unknown_metric_neutral_in_engine_inputs():
    assert normalize("beta", None) is None
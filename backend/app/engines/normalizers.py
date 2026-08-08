"""Piecewise-linear normalizers mapping raw metrics to 0-100 scores.

Every mapping is a tunable data table of ``(input, output)`` breakpoints with
linear interpolation and clamping (ARCHITECTURE.md §9.4). Direction is encoded
in the breakpoints: for "higher-is-better" metrics the table ascends; for
"lower-is-better" metrics (e.g. debt/equity, beta) it descends.

A ``None`` input returns ``None`` (missing-data policy is handled by the
engines, which substitute neutral 50).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class PiecewiseNormalizer:
    """A monotonic piecewise-linear normalizer.

    ``points`` is a tuple of ``(input, output)`` pairs sorted ascending by
    ``input``. Outputs are assumed monotonic in the scoring direction.
    """

    name: str
    points: tuple[tuple[float, float], ...]

    def __call__(self, value: float | int | None) -> float | None:
        if value is None:
            return None
        return self._interp(float(value))

    def _interp(self, x: float) -> float:
        pts = self.points
        if x <= pts[0][0]:
            return pts[0][1]
        if x >= pts[-1][0]:
            return pts[-1][1]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if x0 <= x <= x1:
                if x1 == x0:
                    return y1
                t = (x - x0) / (x1 - x0)
                return y0 + t * (y1 - y0)
        return pts[-1][1]

    def describe(self) -> str:
        """Human-readable breakpoint table (used in docs/ADR)."""
        return self.name + ": " + ", ".join(f"{x}->{y}" for x, y in self.points)


def _pts(*items: tuple[float, float]) -> tuple[tuple[float, float], ...]:
    return tuple(items)


# ---------------------------------------------------------------------------
# Fundamental sub-metric normalizers
# ---------------------------------------------------------------------------
ROE = PiecewiseNormalizer("roe", _pts((0, 30), (10, 50), (25, 80), (30, 95), (100, 100)))
ROA = PiecewiseNormalizer("roa", _pts((0, 25), (5, 50), (15, 80), (25, 95), (100, 100)))
NET_MARGIN = PiecewiseNormalizer("net_margin", _pts((0, 30), (5, 55), (15, 80), (30, 95), (100, 100)))
OPERATING_MARGIN = PiecewiseNormalizer("operating_margin", _pts((0, 30), (5, 55), (15, 80), (30, 95), (100, 100)))
GROSS_MARGIN = PiecewiseNormalizer("gross_margin", _pts((0, 20), (20, 45), (40, 70), (60, 90), (100, 100)))
CURRENT_RATIO = PiecewiseNormalizer("current_ratio", _pts((0, 10), (0.5, 30), (1, 50), (1.5, 65), (2, 78), (3, 90), (5, 100)))
QUICK_RATIO = PiecewiseNormalizer("quick_ratio", _pts((0, 10), (0.3, 30), (0.8, 50), (1.2, 65), (1.8, 80), (3, 95), (5, 100)))
INTEREST_COVERAGE = PiecewiseNormalizer("interest_coverage", _pts((0, 0), (1, 20), (2, 45), (3, 60), (5, 75), (10, 90), (50, 100)))
# Lower debt/equity is better -> descending table.
DEBT_TO_EQUITY = PiecewiseNormalizer("debt_to_equity", _pts((0, 100), (0.2, 90), (0.5, 70), (1, 50), (2, 30), (4, 15), (10, 5)))
REVENUE_GROWTH = PiecewiseNormalizer("revenue_growth", _pts((-20, 10), (0, 40), (10, 70), (20, 85), (40, 95), (100, 100)))
EPS_GROWTH = PiecewiseNormalizer("eps_growth", _pts((-30, 10), (-10, 35), (0, 50), (10, 70), (25, 85), (50, 95), (100, 100)))
FCF_YIELD = PiecewiseNormalizer("fcf_yield", _pts((-5, 10), (0, 40), (2, 60), (5, 80), (10, 95), (20, 100)))

# ---------------------------------------------------------------------------
# Technical sub-metric normalizers
# ---------------------------------------------------------------------------
PRICE_VS_MA = PiecewiseNormalizer("price_vs_ma", _pts((-20, 10), (-10, 25), (-5, 40), (0, 50), (5, 70), (10, 85), (20, 95), (50, 100)))
MA_SLOPE = PiecewiseNormalizer("ma_slope", _pts((-10, 10), (0, 50), (5, 70), (10, 85), (20, 95)))
RSI_14 = PiecewiseNormalizer(
    "rsi_14",
    _pts((0, 20), (30, 55), (45, 60), (50, 62), (55, 65), (65, 70), (70, 55), (80, 30), (100, 10)),
)
MOMENTUM_3M = PiecewiseNormalizer("momentum_3m", _pts((-30, 10), (-10, 30), (0, 50), (10, 70), (25, 85), (50, 95), (100, 100)))
POSITION_52W = PiecewiseNormalizer("position_52w", _pts((0, 30), (25, 50), (50, 65), (75, 80), (90, 88), (100, 90)))
VOLUME_RATIO = PiecewiseNormalizer("volume_ratio", _pts((0, 20), (0.7, 45), (1, 55), (1.5, 70), (2, 80), (3, 90), (5, 95)))

# ---------------------------------------------------------------------------
# Risk sub-metric normalizers (higher score = lower risk / safer)
# ---------------------------------------------------------------------------
BETA = PiecewiseNormalizer("beta", _pts((0, 90), (0.5, 80), (1, 60), (1.5, 45), (2, 30), (3, 15)))
# max_drawdown is expressed as a negative percentage (e.g. -25.0); less negative is better.
MAX_DRAWDOWN = PiecewiseNormalizer("max_drawdown", _pts((-80, 10), (-60, 25), (-40, 40), (-20, 55), (-10, 70), (0, 90)))
REVENUE_VOLATILITY = PiecewiseNormalizer("revenue_volatility", _pts((0, 95), (10, 80), (20, 65), (40, 50), (60, 35), (80, 20), (100, 10)))
EPS_VOLATILITY = PiecewiseNormalizer("eps_volatility", _pts((0, 95), (10, 80), (20, 65), (40, 50), (60, 35), (80, 20), (100, 10)))
MARKET_CAP = PiecewiseNormalizer(
    "market_cap",
    _pts((0, 10), (1e9, 20), (1e10, 35), (5e10, 50), (2e11, 65), (1e12, 80), (3e12, 90), (1e13, 100)),
)
SHARE_LIQUIDITY = PiecewiseNormalizer("share_liquidity", _pts((0, 20), (1e4, 40), (1e5, 55), (1e6, 70), (1e7, 85), (1e8, 95)))

# ---------------------------------------------------------------------------
# Registry (name -> normalizer)
# ---------------------------------------------------------------------------
NORMALIZERS: dict[str, PiecewiseNormalizer] = {
    n.name: n
    for n in (
        ROE, ROA, NET_MARGIN, OPERATING_MARGIN, GROSS_MARGIN,
        CURRENT_RATIO, QUICK_RATIO, INTEREST_COVERAGE, DEBT_TO_EQUITY,
        REVENUE_GROWTH, EPS_GROWTH, FCF_YIELD,
        PRICE_VS_MA, MA_SLOPE, RSI_14, MOMENTUM_3M, POSITION_52W, VOLUME_RATIO,
        BETA, MAX_DRAWDOWN, REVENUE_VOLATILITY, EPS_VOLATILITY, MARKET_CAP, SHARE_LIQUIDITY,
    )
}


def normalize(name: str, value: float | int | None) -> float | None:
    """Normalize ``value`` through the named normalizer (``None`` stays ``None``)."""
    n = NORMALIZERS.get(name)
    if n is None:
        return None
    return n(value)

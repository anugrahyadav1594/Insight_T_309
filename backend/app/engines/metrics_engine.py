"""Metrics engine — pure functions that derive calculated metrics from raw data.

This is the ``raw -> calculated`` step of the value chain (ARCHITECTURE.md §8.4).
All functions are deterministic, unit-testable and perform no I/O.

Inputs are normalized provider data (quotes, metric snapshots, financial
statements, price history); outputs are derived metrics (growth rates, margins,
FCF, moving-average slopes, RSI-lite momentum, volatility, drawdown).
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from typing import Any, Mapping

from app.integrations.market_data.schemas import (
    NormalizedFinancialStatements,
    NormalizedPriceBar,
)


# ---------------------------------------------------------------------------
# Financial-statement derived metrics
# ---------------------------------------------------------------------------
def _latest(statements: Sequence[NormalizedFinancialStatements], field: str) -> float | None:
    """Return the ``field`` value from the most recent annual statement."""
    for st in sorted(statements, key=lambda s: s.fiscal_year, reverse=True):
        val = getattr(st, field, None)
        if val is not None:
            return float(val)
    return None


def _yoy_growth(
    statements: Sequence[NormalizedFinancialStatements], field: str
) -> float | None:
    """YoY growth (%) of ``field`` between the two most recent annual statements."""
    ordered = sorted(
        [s for s in statements if s.period_type == "annual"], key=lambda s: s.fiscal_year, reverse=True
    )
    if len(ordered) < 2:
        return None
    newer = float(getattr(ordered[0], field) or 0.0)
    older = float(getattr(ordered[1], field) or 0.0)
    if older == 0:
        return None
    return (newer - older) / abs(older) * 100.0


def compute_statement_metrics(
    statements: Sequence[NormalizedFinancialStatements],
) -> dict[str, float]:
    """Derive fundamentals from the latest annual statement(s)."""
    result: dict[str, float] = {}
    if not statements:
        return result

    revenue = _latest(statements, "revenue")
    net_income = _latest(statements, "net_income")
    gross_profit = _latest(statements, "gross_profit")
    operating_income = _latest(statements, "operating_income")
    total_equity = _latest(statements, "total_equity")
    total_assets = _latest(statements, "total_assets")
    total_debt = _latest(statements, "total_debt")
    current_assets = getattr(statements[0], "current_assets", None) or 0.0
    current_liabilities = getattr(statements[0], "current_liabilities", None) or 0.0
    inventory = getattr(statements[0], "inventory", None) or 0.0
    ocf = _latest(statements, "operating_cash_flow")
    capex = _latest(statements, "capex")
    fcf = _latest(statements, "free_cash_flow")
    eps = _latest(statements, "eps")
    interest = getattr(statements[0], "interest_expense", None) or getattr(statements[0], "interest_income", None) or 0.0

    if revenue and revenue != 0:
        if gross_profit is not None:
            result["gross_margin"] = gross_profit / revenue * 100.0
        if operating_income is not None:
            result["operating_margin"] = operating_income / revenue * 100.0
        if net_income is not None:
            result["net_margin"] = net_income / revenue * 100.0
    if total_equity and total_equity != 0 and net_income is not None:
        result["roe"] = net_income / total_equity * 100.0
    if total_assets and total_assets != 0 and net_income is not None:
        result["roa"] = net_income / total_assets * 100.0
    if total_equity and total_equity != 0 and total_debt is not None:
        result["debt_to_equity"] = total_debt / total_equity
    if current_liabilities and current_liabilities != 0 and current_assets:
        result["current_ratio"] = current_assets / current_liabilities
    if current_liabilities and current_liabilities != 0 and current_assets and inventory is not None:
        result["quick_ratio"] = (current_assets - inventory) / current_liabilities
    if interest != 0 and operating_income is not None:
        result["interest_coverage"] = operating_income / abs(interest)
    if fcf is not None:
        result["free_cash_flow"] = fcf
    elif ocf is not None and capex is not None:
        result["free_cash_flow"] = ocf - capex
    if eps is not None:
        result["eps"] = eps

    rev_growth = _yoy_growth(statements, "revenue")
    if rev_growth is not None:
        result["revenue_growth"] = rev_growth
    eps_growth = _yoy_growth(statements, "eps")
    if eps_growth is not None:
        result["eps_growth"] = eps_growth

    return result


# ---------------------------------------------------------------------------
# Price-history derived metrics (technical)
# ---------------------------------------------------------------------------
def _closes(prices: Sequence[NormalizedPriceBar]) -> list[float]:
    return [float(p.close) for p in sorted(prices, key=lambda p: p.trade_date)]


def sma(values: Sequence[float], window: int) -> list[float | None]:
    """Simple moving average aligned to the last index (``None`` for early windows)."""
    out: list[float | None] = [None] * len(values)
    for i in range(len(values)):
        if i + 1 >= window:
            out[i] = sum(values[i + 1 - window : i + 1]) / window
    return out


def sma_at(values: Sequence[float], window: int, idx: int = -1) -> float | None:
    ma = sma(values, window)
    return ma[idx]


def _slope_pct(values: Sequence[float], window: int, idx: int = -1) -> float | None:
    """Percent change of the SMA over its window (approximates the MA slope)."""
    ma = sma(values, window)
    i = len(values) - 1 if idx == -1 else idx
    cur = ma[i]
    prev = ma[i - window] if i - window >= 0 else ma[0]
    if cur is None or prev is None or prev == 0:
        return None
    return (cur - prev) / abs(prev) * 100.0


def rsi14(values: Sequence[float]) -> float | None:
    """RSI-14 (Wilder's smoothing) on the close series."""
    if len(values) < 15:
        return None
    gains: list[float] = []
    losses: list[float] = []
    for i in range(1, len(values)):
        change = values[i] - values[i - 1]
        gains.append(max(change, 0.0))
        losses.append(max(-change, 0.0))
    # Wilder's smoothing average of the last 14 changes.
    window = gains[-14:]
    avg_gain = sum(window) / 14.0
    avg_loss = sum(losses[-14:]) / 14.0
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def max_drawdown(values: Sequence[float]) -> float:
    """Maximum drawdown (%) over the series (negative)."""
    if not values:
        return 0.0
    peak = values[0]
    max_dd = 0.0
    for v in values:
        if v > peak:
            peak = v
        if peak > 0:
            dd = (v - peak) / peak * 100.0
            if dd < max_dd:
                max_dd = dd
    return max_dd


def compute_price_metrics(
    prices: Sequence[NormalizedPriceBar],
    current_price: float | None = None,
) -> dict[str, float]:
    """Derive technical metrics from daily OHLCV history."""
    result: dict[str, float] = {}
    if not prices:
        return result

    closes = _closes(prices)
    last = closes[-1]

    # 52-week position (% of the 52w range)
    lookback = closes[-250:]
    lo, hi = min(lookback), max(lookback)
    if hi > lo:
        result["position_52w"] = (last - lo) / (hi - lo) * 100.0

    for window, key in ((20, "price_vs_ma20"), (50, "price_vs_ma50"), (200, "price_vs_ma200")):
        ma = sma_at(closes, window)
        if ma:
            result[key] = (last - ma) / ma * 100.0

    slope = _slope_pct(closes, 50)
    if slope is not None:
        result["ma50_slope"] = slope

    r = rsi14(closes)
    if r is not None:
        result["rsi_14"] = r

    if len(closes) >= 64:
        three_months_ago = closes[-64]
        if three_months_ago != 0:
            result["momentum_3m"] = (last - three_months_ago) / abs(three_months_ago) * 100.0

    # Volume ratio: today vs 20-day average
    volumes = [float(p.volume) for p in sorted(prices, key=lambda p: p.trade_date)]
    if len(volumes) >= 21:
        avg_vol = sum(volumes[-21:-1]) / 20.0
        if avg_vol > 0:
            result["volume_ratio"] = volumes[-1] / avg_vol

    # 30-day annualized volatility (%)
    if len(closes) >= 30:
        window = closes[-30:]
        rets = [(window[i] / window[i - 1] - 1.0) for i in range(1, len(window)) if window[i - 1] != 0]
        if len(rets) >= 2:
            mean = sum(rets) / len(rets)
            var = sum((r - mean) ** 2 for r in rets) / (len(rets) - 1)
            result["volatility_30d"] = math.sqrt(var) * math.sqrt(252) * 100.0

    result["max_drawdown"] = max_drawdown(closes)

    return result


def compute_fcf_yield(free_cash_flow: float | None, market_cap: float | None) -> float | None:
    """FCF yield (%) — free cash flow over market cap."""
    if free_cash_flow is None or not market_cap:
        return None
    if market_cap == 0:
        return None
    return free_cash_flow / market_cap * 100.0


def build_calculated_metrics(
    *,
    metrics: Mapping[str, Any] | None = None,
    statements: Sequence[NormalizedFinancialStatements] | None = None,
    prices: Sequence[NormalizedPriceBar] | None = None,
    market_cap: float | None = None,
) -> dict[str, float | None]:
    """Assemble the full ``calculated_metrics`` layer from all raw sources."""
    calculated: dict[str, float | None] = {}

    stmt_metrics = compute_statement_metrics(statements or [])
    calculated.update({k: float(v) for k, v in stmt_metrics.items()})

    price_metrics = compute_price_metrics(prices or [])
    calculated.update({k: float(v) for k, v in price_metrics.items()})

    # FCF yield derived from FCF + market cap
    fcf = calculated.get("free_cash_flow")
    fcf_yield = compute_fcf_yield(fcf, market_cap)
    if fcf_yield is not None:
        calculated["fcf_yield"] = fcf_yield

    # Carry through any provider metrics that were not otherwise derived.
    if metrics:
        for key in ("pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda", "dividend_yield", "beta"):
            if key not in calculated and metrics.get(key) is not None:
                calculated[key] = float(metrics[key])

    return calculated

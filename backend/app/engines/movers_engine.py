"""Movers engine — deterministic gainers/losers computation (ARCHITECTURE.md §8.4).

Pure functions. Given a company's daily price bars (sorted by trade date) and a
look-back period (expressed in trading days), compute the percentage change of
the close over that window. Direction: positive = gainer, negative = loser.
"""

from __future__ import annotations

from dataclasses import dataclass

# Map of period codes -> number of trading days to look back.
# 1D = previous close, 1W = 5 trading days, 1M = ~21, 3M = ~63, 6M = ~126, 1Y = ~252.
PERIOD_LOOKBACK_DAYS: dict[str, int] = {
    "1D": 1,
    "1W": 5,
    "1M": 21,
    "3M": 63,
    "6M": 126,
    "1Y": 252,
}

SUPPORTED_PERIODS = tuple(PERIOD_LOOKBACK_DAYS.keys())


def normalize_period(period: str | None) -> str:
    """Return a supported period code (default '1D')."""
    if period is None:
        return "1D"
    return period.upper() if period.upper() in PERIOD_LOOKBACK_DAYS else "1D"


@dataclass(frozen=True)
class Mover:
    """A single company's return over a period."""

    ticker: str
    name: str
    exchange: str
    sector: str | None
    price: float | None
    change_pct: float | None
    change: float | None
    direction: str  # "gainers" | "losers"
    period: str


def _closes(prices: list[tuple[object, object]]) -> list[float]:
    """Extract close values from a list of (date, close) tuples sorted by date."""
    return [float(c) for _, c in prices]


def period_return(prices: list[tuple[object, object]], lookback: int) -> tuple[float | None, float | None, float | None]:
    """Return ``(change_pct, current_price, period_start_price)``.

    ``prices`` is a list of ``(trade_date, close)`` sorted ascending by date.
    ``lookback`` is the number of trading days to look back (1 = previous day).
    Returns ``None`` values when there isn't enough history.
    """
    closes = _closes(prices)
    if not closes:
        return None, None, None
    current = closes[-1]
    idx = len(closes) - 1 - lookback
    if idx < 0:
        idx = 0
    start = closes[idx]
    if start == 0:
        return None, current, None
    change = current - start
    pct = change / start * 100.0
    return pct, current, start


def compute_movers(
    companies_prices: dict[str, dict],
    period: str,
    direction: str,
    limit: int = 10,
) -> list[Mover]:
    """Compute gainers or losers across companies.

    ``companies_prices`` maps ticker -> {
        "name", "exchange", "sector", "prices": [(date, close), ...] (ascending)
    }.
    Returns a list of :class:`Mover` sorted by absolute change (descending),
    filtered by ``direction``.
    """
    period_norm = normalize_period(period)
    lookback = PERIOD_LOOKBACK_DAYS[period_norm]
    movers: list[Mover] = []
    for ticker, data in companies_prices.items():
        pct, current, _start = period_return(data["prices"], lookback)
        if pct is None or current is None:
            continue
        direction_of = "gainers" if pct >= 0 else "losers"
        if direction and direction.lower() in ("gainers", "losers") and direction.lower() != direction_of:
            continue
        movers.append(
            Mover(
                ticker=ticker,
                name=data.get("name", ticker),
                exchange=data.get("exchange", "NSE"),
                sector=data.get("sector"),
                price=current,
                change_pct=round(pct, 4),
                change=round(current - (_start or current), 2),
                direction=direction_of,
                period=period_norm,
            )
        )
    # Sort by absolute return, descending.
    movers.sort(key=lambda m: abs(m.change_pct or 0.0), reverse=True)
    return movers[:limit]
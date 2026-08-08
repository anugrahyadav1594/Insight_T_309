"""Portfolio mathematics — pure functions (ARCHITECTURE.md §11.2).

* Per holding: invested value, current value, P&L, P&L %, weight.
* Portfolio: totals, sector concentration, market-cap/current-value-weighted
  aggregate scores (weight 0 for holdings with no score; confidence adjusted
  for coverage).
"""

from __future__ import annotations

from decimal import Decimal
from typing import Mapping, Sequence

from app.engines.scoring_util import clamp


def as_float(value: Decimal | float | None) -> float:
    return float(value or 0.0)


def compute_holding_math(
    quantity: Decimal | float,
    average_buy_price: Decimal | float,
    current_price: Decimal | float | None,
) -> dict[str, float]:
    """Per-holding math (values are floats for the response layer)."""
    qty = as_float(quantity)
    buy = as_float(average_buy_price)
    invested = qty * buy
    current = qty * (as_float(current_price) if current_price is not None else buy)
    pnl = current - invested
    pnl_pct = (pnl / invested * 100.0) if invested else 0.0
    return {
        "invested_value": round(invested, 2),
        "current_value": round(current, 2),
        "pnl": round(pnl, 2),
        "pnl_pct": round(pnl_pct, 4),
    }


def compute_portfolio_summary(holdings: Sequence[Mapping[str, float]]) -> dict[str, float]:
    """Aggregate a list of holding math dicts into a portfolio summary."""
    total_invested = sum(as_float(h.get("invested_value")) for h in holdings)
    total_value = sum(as_float(h.get("current_value")) for h in holdings)
    total_pl = total_value - total_invested
    total_pl_pct = (total_pl / total_invested * 100.0) if total_invested else 0.0
    return {
        "total_value": round(total_value, 2),
        "total_invested": round(total_invested, 2),
        "total_pl": round(total_pl, 2),
        "total_pl_pct": round(total_pl_pct, 4),
        "holdings_count": len(holdings),
    }


def compute_weights(holdings: Sequence[Mapping[str, float]]) -> dict[str, float]:
    """Weight (%) of each holding by current value."""
    total = sum(as_float(h.get("current_value")) for h in holdings)
    if total <= 0:
        return {str(h.get("ticker", idx)): 0.0 for idx, h in enumerate(holdings)}
    return {
        str(h.get("ticker", idx)): round(as_float(h.get("current_value")) / total * 100.0, 4)
        for idx, h in enumerate(holdings)
    }


def compute_sector_concentration(
    holdings: Sequence[Mapping[str, float]],
) -> list[dict[str, float]]:
    """Weight (%) per sector, sorted descending."""
    total = sum(as_float(h.get("current_value")) for h in holdings)
    if total <= 0:
        return []
    by_sector: dict[str, float] = {}
    for h in holdings:
        sector = str(h.get("sector") or "Unknown")
        by_sector[sector] = by_sector.get(sector, 0.0) + as_float(h.get("current_value"))
    return [
        {"sector": sector, "weight": round(value / total * 100.0, 4)}
        for sector, value in sorted(by_sector.items(), key=lambda kv: kv[1], reverse=True)
    ]


def compute_weighted_scores(
    holdings: Sequence[Mapping[str, float]],
    score_keys: Sequence[str] = ("fundamental", "technical", "risk", "overall"),
) -> dict[str, float | None]:
    """Current-value-weighted aggregate of each holding's scores.

    Holdings without a score contribute zero weight. ``confidence`` is the
    fraction of portfolio value covered by scored holdings.
    """
    total_value = sum(as_float(h.get("current_value")) for h in holdings)
    if total_value <= 0:
        return {k: None for k in score_keys} | {"confidence": 0.0}

    covered_value = 0.0
    acc: dict[str, float] = {k: 0.0 for k in score_keys}
    for h in holdings:
        weight = as_float(h.get("current_value"))
        has_score = False
        for key in score_keys:
            val = h.get(f"{key}_score")
            if val is not None:
                acc[key] += weight * float(val)
                has_score = True
        if has_score:
            covered_value += weight

    confidence = covered_value / total_value if total_value else 0.0
    result: dict[str, float | None] = {}
    for key in score_keys:
        if covered_value > 0:
            result[key] = round(clamp(acc[key] / covered_value), 1)
        else:
            result[key] = None
    result["confidence"] = round(clamp(confidence, 0.0, 1.0), 4)
    return result


def risk_health_label(risk_score: float | None) -> str:
    """Map a risk score (0-100, higher = safer) to a label."""
    if risk_score is None:
        return "UNKNOWN"
    if risk_score >= 80:
        return "LOW"
    if risk_score >= 60:
        return "MODERATE"
    if risk_score >= 40:
        return "ELEVATED"
    return "HIGH"

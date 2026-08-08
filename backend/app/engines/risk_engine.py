"""Risk scoring engine (deterministic, pure).

Weights (ARCHITECTURE.md §9.2): financial_risk 0.40, earnings_stability 0.30,
market_risk 0.20, size_factor 0.10.

A higher risk *score* means lower risk (safer). Direction is handled by the
normalizer tables (e.g. lower debt/equity, lower beta, smaller drawdown and
larger cap all map to higher scores).
"""

from __future__ import annotations

from typing import Mapping

from app.engines.config import DEFAULT_SCORING_CONFIG, ScoringConfig
from app.engines.normalizers import normalize
from app.engines.scoring_util import clamp, weighted_score
from app.schemas.score import RiskScore

_FINANCIAL = {
    "debt_to_equity": 1.0,
    "current_ratio": 1.0,
    "interest_coverage": 1.0,
}
_EARNINGS_STABILITY = {
    "eps_volatility": 1.0,
    "revenue_volatility": 1.0,
}
_MARKET = {
    "beta": 1.0,
    "max_drawdown": 1.0,
}
_SIZE = {
    "market_cap": 1.0,
    "share_liquidity": 1.0,
}


def _factor_scores(metrics: Mapping[str, float | None], submap: Mapping[str, float]) -> tuple[dict[str, float | None], int]:
    normalized: dict[str, float | None] = {}
    present = 0
    for name in submap:
        value = normalize(name, metrics.get(name))
        normalized[name] = value
        if value is not None:
            present += 1
    return normalized, present


def compute_risk(
    metrics: Mapping[str, float | None],
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> RiskScore:
    """Compute the risk score (0-100) and its breakdown."""
    if not metrics:
        return RiskScore(score=50.0, breakdown={}, confidence=0.0,
                         warnings=["no risk metrics provided"])

    weights = config.normalize_weights(config.risk_weights)

    fin_map, fin_present = _factor_scores(metrics, _FINANCIAL)
    est_map, est_present = _factor_scores(metrics, _EARNINGS_STABILITY)
    mkt_map, mkt_present = _factor_scores(metrics, _MARKET)
    size_map, size_present = _factor_scores(metrics, _SIZE)

    financial, fin_conf, _ = weighted_score(fin_map, _FINANCIAL)
    earnings, est_conf, _ = weighted_score(est_map, _EARNINGS_STABILITY)
    market, mkt_conf, _ = weighted_score(mkt_map, _MARKET)
    size, size_conf, _ = weighted_score(size_map, _SIZE)

    breakdown = {
        "financial_risk": round(financial, 1),
        "earnings_stability": round(earnings, 1),
        "market_risk": round(market, 1),
        "size_factor": round(size, 1),
    }

    score = (
        weights["financial_risk"] * financial
        + weights["earnings_stability"] * earnings
        + weights["market_risk"] * market
        + weights["size_factor"] * size
    )
    factor_conf = (
        weights["financial_risk"] * fin_conf
        + weights["earnings_stability"] * est_conf
        + weights["market_risk"] * mkt_conf
        + weights["size_factor"] * size_conf
    )

    warnings: list[str] = []
    expected = {"financial_risk": 3, "earnings_stability": 2, "market_risk": 2, "size_factor": 2}
    for factor, present in (("financial_risk", fin_present), ("earnings_stability", est_present),
                            ("market_risk", mkt_present), ("size_factor", size_present)):
        if present < expected[factor]:
            warnings.append(f"partial data for {factor}: {present}/{expected[factor]}")

    return RiskScore(
        score=round(clamp(score), 1),
        breakdown=breakdown,
        confidence=round(clamp(factor_conf, 0.0, 1.0), 4),
        warnings=warnings,
    )

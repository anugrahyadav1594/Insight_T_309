"""Fundamental scoring engine (deterministic, pure).

Weights (ARCHITECTURE.md §9.2): profitability 0.40, liquidity 0.30,
efficiency 0.30.

Input metrics (§9.3): ROE, ROA, net/operating/gross margin, revenue growth,
EPS growth, FCF yield, current ratio, quick ratio, debt/equity, interest
coverage.
"""

from __future__ import annotations

from typing import Mapping

from app.engines.config import DEFAULT_SCORING_CONFIG, ScoringConfig
from app.engines.normalizers import normalize
from app.engines.scoring_util import clamp, weighted_score
from app.schemas.score import FundamentalScore

# Sub-metrics grouped by factor (normalizer name, weight within factor).
_PROFITABILITY = {
    "roe": 1.0,
    "roa": 1.0,
    "net_margin": 1.0,
    "operating_margin": 1.0,
    "gross_margin": 1.0,
}
_LIQUIDITY = {
    "current_ratio": 1.0,
    "quick_ratio": 1.0,
    "interest_coverage": 1.0,
    "debt_to_equity": 1.0,
}
_EFFICIENCY = {
    "revenue_growth": 1.0,
    "eps_growth": 1.0,
    "fcf_yield": 1.0,
}


def _factor_scores(metrics: Mapping[str, float | None], submap: Mapping[str, float]) -> tuple[float, float]:
    """Return ``(normalized_submetric_map, present_count)`` for a factor."""
    normalized: dict[str, float | None] = {}
    present = 0
    for name in submap:
        raw = metrics.get(name)
        value = normalize(name, raw)
        normalized[name] = value
        if value is not None:
            present += 1
    return normalized, present


def compute_fundamental(
    metrics: Mapping[str, float | None],
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> FundamentalScore:
    """Compute the fundamental score (0-100) and its breakdown."""
    if not metrics:
        return FundamentalScore(score=50.0, breakdown={}, confidence=0.0,
                                warnings=["no fundamental metrics provided"])

    weights = config.normalize_weights(config.fundamental_weights)

    prof_map, prof_present = _factor_scores(metrics, _PROFITABILITY)
    liq_map, liq_present = _factor_scores(metrics, _LIQUIDITY)
    eff_map, eff_present = _factor_scores(metrics, _EFFICIENCY)

    profitability, prof_conf, _ = weighted_score(prof_map, _PROFITABILITY)
    liquidity, liq_conf, _ = weighted_score(liq_map, _LIQUIDITY)
    efficiency, eff_conf, _ = weighted_score(eff_map, _EFFICIENCY)

    breakdown = {
        "profitability": round(profitability, 1),
        "liquidity": round(liquidity, 1),
        "efficiency": round(efficiency, 1),
    }

    # Weighted mean of factor scores by the configured factor weights.
    score = (
        weights["profitability"] * profitability
        + weights["liquidity"] * liquidity
        + weights["efficiency"] * efficiency
    )

    # Confidence = weighted average of factor confidences (data coverage).
    factor_conf = (
        weights["profitability"] * prof_conf
        + weights["liquidity"] * liq_conf
        + weights["efficiency"] * eff_conf
    )

    warnings: list[str] = []
    expected = {"profitability": 5, "liquidity": 4, "efficiency": 3}
    for factor, present in (("profitability", prof_present), ("liquidity", liq_present),
                            ("efficiency", eff_present)):
        if present < expected[factor]:
            warnings.append(f"partial data for {factor}: {present}/{expected[factor]}")

    return FundamentalScore(
        score=round(clamp(score), 1),
        breakdown=breakdown,
        confidence=round(clamp(factor_conf, 0.0, 1.0), 4),
        warnings=warnings,
    )

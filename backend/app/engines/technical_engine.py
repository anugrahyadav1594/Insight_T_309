"""Technical scoring engine (deterministic, pure).

Weights (ARCHITECTURE.md §9.2): trend 0.40, momentum 0.40,
volume_confirmation 0.20.

Inputs (§9.3): price vs 20/50/200-day MA, MA slope, RSI-lite momentum,
3-month return, volume ratio, 52-week position.
"""

from __future__ import annotations

from typing import Mapping

from app.engines.config import DEFAULT_SCORING_CONFIG, ScoringConfig
from app.engines.normalizers import normalize
from app.engines.scoring_util import clamp, weighted_score
from app.schemas.score import TechnicalScore

_TREND = {
    "price_vs_ma20": 1.0,
    "price_vs_ma50": 1.0,
    "price_vs_ma200": 1.0,
    "ma50_slope": 1.0,
}
_MOMENTUM = {
    "rsi_14": 1.0,
    "momentum_3m": 1.0,
    "position_52w": 1.0,
}
_VOLUME = {
    "volume_ratio": 1.0,
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


def compute_technical(
    metrics: Mapping[str, float | None],
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> TechnicalScore:
    """Compute the technical score (0-100) and its breakdown."""
    if not metrics:
        return TechnicalScore(score=50.0, breakdown={}, confidence=0.0,
                              warnings=["no technical metrics provided"])

    weights = config.normalize_weights(config.technical_weights)

    trend_map, trend_present = _factor_scores(metrics, _TREND)
    mom_map, mom_present = _factor_scores(metrics, _MOMENTUM)
    vol_map, vol_present = _factor_scores(metrics, _VOLUME)

    trend, trend_conf, _ = weighted_score(trend_map, _TREND)
    momentum, mom_conf, _ = weighted_score(mom_map, _MOMENTUM)
    volume, vol_conf, _ = weighted_score(vol_map, _VOLUME)

    breakdown = {
        "trend": round(trend, 1),
        "momentum": round(momentum, 1),
        "volume_confirmation": round(volume, 1),
    }

    score = (
        weights["trend"] * trend
        + weights["momentum"] * momentum
        + weights["volume_confirmation"] * volume
    )
    factor_conf = (
        weights["trend"] * trend_conf
        + weights["momentum"] * mom_conf
        + weights["volume_confirmation"] * vol_conf
    )

    warnings: list[str] = []
    expected = {"trend": 4, "momentum": 3, "volume_confirmation": 1}
    for factor, present in (("trend", trend_present), ("momentum", mom_present),
                            ("volume_confirmation", vol_present)):
        if present < expected[factor]:
            warnings.append(f"partial data for {factor}: {present}/{expected[factor]}")

    return TechnicalScore(
        score=round(clamp(score), 1),
        breakdown=breakdown,
        confidence=round(clamp(factor_conf, 0.0, 1.0), 4),
        warnings=warnings,
    )

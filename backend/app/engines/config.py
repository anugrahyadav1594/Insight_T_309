"""Scoring configuration (ARCHITECTURE.md §9.2).

All weights and recommendation bands are DATA — configurable via environment
variables without changing code. The defaults match §9.2 exactly.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field


def _env_float_list(key: str, default: list[tuple[float, float]]) -> list[tuple[float, float]]:
    raw = os.getenv(key)
    if not raw:
        return default
    try:
        items = json.loads(raw)
        return [(float(a), float(b)) for a, b in items]
    except (json.JSONDecodeError, ValueError, TypeError):
        return default


def _env_weights(key: str, default: dict[str, float]) -> dict[str, float]:
    raw = os.getenv(key)
    if not raw:
        return default
    try:
        return {str(k): float(v) for k, v in json.loads(raw).items()}
    except (json.JSONDecodeError, ValueError, TypeError):
        return default


def _env_bands(key: str, default: list[tuple[int, int, str]]) -> list[tuple[int, int, str]]:
    raw = os.getenv(key)
    if not raw:
        return default
    try:
        items = json.loads(raw)
        return [(int(lo), int(hi), str(label)) for lo, hi, label in items]
    except (json.JSONDecodeError, ValueError, TypeError):
        return default


@dataclass(frozen=True)
class ScoringConfig:
    """Immutable scoring configuration.

    The three ``*_weights`` dictionaries must each sum to 1.0.
    """

    fundamental_weights: dict[str, float] = field(
        default_factory=lambda: _env_weights(
            "FUNDAMENTAL_WEIGHTS",
            {"profitability": 0.40, "liquidity": 0.30, "efficiency": 0.30},
        )
    )
    technical_weights: dict[str, float] = field(
        default_factory=lambda: _env_weights(
            "TECHNICAL_WEIGHTS",
            {"trend": 0.40, "momentum": 0.40, "volume_confirmation": 0.20},
        )
    )
    risk_weights: dict[str, float] = field(
        default_factory=lambda: _env_weights(
            "RISK_WEIGHTS",
            {"financial_risk": 0.40, "earnings_stability": 0.30,
             "market_risk": 0.20, "size_factor": 0.10},
        )
    )
    overall_weights: dict[str, float] = field(
        default_factory=lambda: _env_weights(
            "OVERALL_WEIGHTS",
            {"fundamental": 0.50, "technical": 0.20, "risk": 0.30},
        )
    )
    recommendation_bands: list[tuple[int, int, str]] = field(
        default_factory=lambda: _env_bands(
            "RECOMMENDATION_BANDS",
            [
                (90, 100, "STRONG_BUY"),
                (75, 89, "BUY"),
                (60, 74, "HOLD"),
                (40, 59, "NEUTRAL"),
                (0, 39, "BEARISH"),
            ],
        )
    )

    def normalize_weights(self, weights: dict[str, float]) -> dict[str, float]:
        """Re-normalize a weights dict so it sums to 1.0 (guards bad env input)."""
        total = sum(weights.values())
        if total <= 0:
            # Fall back to equal weights on malformed config.
            n = len(weights) or 1
            return {k: 1.0 / n for k in weights}
        return {k: v / total for k, v in weights.items()}


DEFAULT_SCORING_CONFIG = ScoringConfig()
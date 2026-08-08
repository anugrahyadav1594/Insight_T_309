"""Shared helpers for the deterministic scoring engines.

Implements the missing-data policy (ARCHITECTURE.md §9.5): a missing sub-metric
contributes a neutral 50 with weight redistribution over available sub-metrics,
and engine confidence is the fraction of expected inputs present.
"""

from __future__ import annotations

from typing import Mapping

NEUTRAL = 50.0


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp ``value`` into ``[lo, hi]``."""
    return max(lo, min(hi, float(value)))


def weighted_score(
    normalized: Mapping[str, float | None],
    weights: Mapping[str, float],
) -> tuple[float, float, list[str]]:
    """Weighted mean of available 0-100 sub-metric scores.

    Returns ``(score, confidence, warnings)``. Missing sub-metrics are excluded
    and their weight is redistributed over the available ones. If nothing is
    available, returns the neutral 50 with confidence 0.
    """
    warnings: list[str] = []
    available_weight = 0.0
    acc = 0.0
    for name, weight in weights.items():
        val = normalized.get(name)
        if val is None:
            continue
        available_weight += weight
        acc += weight * float(val)

    total_weight = sum(weights.values()) or 1.0
    if available_weight <= 0:
        return NEUTRAL, 0.0, ["no sub-metrics available"]

    confidence = available_weight / total_weight
    score = acc / available_weight
    return clamp(score), clamp(confidence, 0.0, 1.0), warnings


def engine_confidence(present: int, expected: int) -> float:
    """Fraction of expected inputs present (0-1)."""
    if expected <= 0:
        return 0.0
    return clamp(present / expected, 0.0, 1.0)

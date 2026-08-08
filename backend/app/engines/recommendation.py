"""Map a 0-100 overall score to a recommendation band (ARCHITECTURE.md §9.7).

Recommendation is a PURE function of the overall score — the LLM can explain
it but can never change it.
"""

from __future__ import annotations

from app.engines.config import DEFAULT_SCORING_CONFIG, ScoringConfig


def recommend(
    overall_score: float,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> str:
    """Return the recommendation label for ``overall_score``.

    Bands are inclusive on both ends (e.g. 90.0 -> STRONG_BUY, 89.9 -> BUY).
    Bands are ordered from highest to lowest; the first band whose lower bound
    the score satisfies wins.
    """
    score = max(0.0, min(100.0, float(overall_score)))
    for lo, hi, label in sorted(
        config.recommendation_bands, key=lambda b: b[0], reverse=True
    ):
        if lo <= score <= hi:
            return label
    # Fallback: scores must lie within [0,100]; defensive.
    if score >= 90:
        return "STRONG_BUY"
    if score >= 75:
        return "BUY"
    if score >= 60:
        return "HOLD"
    if score >= 40:
        return "NEUTRAL"
    return "BEARISH"

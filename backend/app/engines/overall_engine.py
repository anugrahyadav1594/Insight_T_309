"""Overall score engine — weighted combination of the three engines.

Weights (ARCHITECTURE.md §9.2): fundamental 0.50, technical 0.20, risk 0.30.
Produces the deterministic recommendation via :mod:`app.engines.recommendation`.
"""

from __future__ import annotations

from app.engines.config import DEFAULT_SCORING_CONFIG, ScoringConfig
from app.engines.recommendation import recommend
from app.engines.scoring_util import clamp
from app.schemas.score import OverallScore


def compute_overall(
    fundamental: float,
    technical: float,
    risk: float,
    fundamental_conf: float = 1.0,
    technical_conf: float = 1.0,
    risk_conf: float = 1.0,
    config: ScoringConfig = DEFAULT_SCORING_CONFIG,
) -> OverallScore:
    """Combine the three engine scores into an overall score + recommendation.

    ``confidence`` is the weighted average of the engine confidences (data
    coverage), bounded 0-1.
    """
    weights = config.normalize_weights(config.overall_weights)
    score = (
        weights["fundamental"] * fundamental
        + weights["technical"] * technical
        + weights["risk"] * risk
    )
    score = round(clamp(score), 1)

    confidence = (
        weights["fundamental"] * fundamental_conf
        + weights["technical"] * technical_conf
        + weights["risk"] * risk_conf
    )
    confidence = round(clamp(confidence, 0.0, 1.0), 4)

    return OverallScore(
        score=score,
        fundamental=round(float(fundamental), 1),
        technical=round(float(technical), 1),
        risk=round(float(risk), 1),
        recommendation=recommend(score, config),
        confidence=confidence,
    )

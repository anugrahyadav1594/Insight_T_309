"""Unit tests for recommendation band mapping (§24.2)."""

from __future__ import annotations

from app.engines.config import ScoringConfig
from app.engines.recommendation import recommend


def test_band_boundaries():
    assert recommend(90) == "STRONG_BUY"
    assert recommend(89.9) == "BUY"
    assert recommend(75) == "BUY"
    assert recommend(74.9) == "HOLD"
    assert recommend(60) == "HOLD"
    assert recommend(59.9) == "NEUTRAL"
    assert recommend(40) == "NEUTRAL"
    assert recommend(39.9) == "BEARISH"
    assert recommend(0) == "BEARISH"
    assert recommend(100) == "STRONG_BUY"


def test_clamping_out_of_range():
    assert recommend(-5) == "BEARISH"
    assert recommend(150) == "STRONG_BUY"


def test_configurable_bands():
    config = ScoringConfig(
        recommendation_bands=[(80, 100, "STRONG_BUY"), (0, 79, "BEARISH")]
    )
    assert recommend(85, config) == "STRONG_BUY"
    assert recommend(50, config) == "BEARISH"
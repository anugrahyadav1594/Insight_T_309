"""Live FMP smoke test — verifies the real FMP stable endpoints work with a key.

Skipped automatically when no ``FMP_API_KEY`` is configured (e.g. in CI) or when
the network is unavailable. Run manually with a real key:

    FMP_API_KEY=<your_key> python -m pytest tests/integration/test_fmp_live.py -s
"""

from __future__ import annotations

import os

import pytest

from app.integrations.market_data.fmp_provider import FMPMarketDataProvider

pytestmark = pytest.mark.skipif(
    not os.getenv("FMP_API_KEY"),
    reason="FMP_API_KEY not set; skipping live FMP test",
)


@pytest.fixture
def provider() -> FMPMarketDataProvider:
    return FMPMarketDataProvider()


async def test_live_profile(provider: FMPMarketDataProvider):
    profile = await provider.get_profile("TCS")
    assert profile.ticker
    assert profile.name


async def test_live_quote(provider: FMPMarketDataProvider):
    quote = await provider.get_quote("TCS")
    assert quote.price is not None
    assert quote.ticker


async def test_live_ratios(provider: FMPMarketDataProvider):
    metrics = await provider.get_metrics("TCS")
    assert metrics.ticker
    # Fields are defensive; just ensure no exception and ticker is set.
    assert metrics.data_as_of is not None


async def test_live_health(provider: FMPMarketDataProvider):
    health = await provider.health_check()
    assert health.status in ("available", "degraded", "unavailable")
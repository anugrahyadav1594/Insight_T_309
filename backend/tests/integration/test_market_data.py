"""Provider error-mapping tests (§24.2)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.core.exceptions import MarketDataUnavailableError
from app.models.company import Company
from app.services.market_data_service import market_data_service


async def test_timeout_maps_to_unavailable(db_session, mock_provider):
    mock_provider.set_failure("timeout")
    with pytest.raises(MarketDataUnavailableError):
        await market_data_service.get_company_snapshot(db_session, mock_provider, "NODATA")


async def test_ratelimit_maps_to_unavailable(db_session, mock_provider):
    mock_provider.set_failure("ratelimit")
    with pytest.raises(MarketDataUnavailableError):
        await market_data_service.get_company_snapshot(db_session, mock_provider, "NODATA")


async def test_invalid_response_maps_to_unavailable(db_session, mock_provider):
    mock_provider.set_failure("invalid")
    with pytest.raises(MarketDataUnavailableError):
        await market_data_service.get_company_snapshot(db_session, mock_provider, "NODATA")


async def test_stale_db_served_on_failure(db_session, mock_provider):
    # Make TCS stale, then fail the provider -> stale bundle served.
    res = await db_session.execute(select(Company).where(Company.ticker == "TCS"))
    company = res.scalar_one()
    company.metrics.data_as_of = datetime.now(timezone.utc) - timedelta(hours=5)
    await db_session.commit()

    mock_provider.set_failure("connection")
    bundle = await market_data_service.get_company_snapshot(db_session, mock_provider, "TCS")
    assert bundle.stale is True
    assert bundle.company.ticker == "TCS"


async def test_fresh_db_no_provider_call(db_session, mock_provider):
    # TCS seeded data is fresh -> served from DB without calling the provider.
    bundle = await market_data_service.get_company_snapshot(db_session, mock_provider, "TCS")
    assert bundle.stale is False
    assert bundle.metrics is not None
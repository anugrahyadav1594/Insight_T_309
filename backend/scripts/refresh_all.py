"""Bulk refresh of all seeded companies from the provider (dev tool, §29).

Usage:
    python -m scripts.refresh_all            # all companies
    python -m scripts.refresh_all TCS INFY   # specific tickers
"""

from __future__ import annotations

import asyncio
import sys

from app.repositories import company_repository


async def main() -> int:
    from app.db.session import async_session_factory
    from app.integrations.market_data.factory import get_market_data_provider
    from app.services.market_data_service import market_data_service

    provider = get_market_data_provider()
    tickers = sys.argv[1:] or None
    async with async_session_factory() as db:
        if tickers:
            companies = [await company_repository.get_company_by_ticker(db, t) for t in tickers]
            companies = [c for c in companies if c is not None]
        else:
            companies = await company_repository.get_all(db)
        for company in companies:
            try:
                result = await market_data_service.refresh_company_data(
                    db, provider, company.ticker
                )
                print("refreshed", result.get("ticker"), "score", result.get("overall_score"))
            except Exception as exc:  # noqa: BLE001
                print("FAILED", company.ticker, type(exc).__name__)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
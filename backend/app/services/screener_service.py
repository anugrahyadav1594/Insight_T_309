"""Stock screener service (ARCHITECTURE.md §14).

Structured filters OR natural language → validated :class:`ScreenerFilter` →
safe SQLAlchemy ORM query. The AI emits a *filter object*, never SQL; the query
builder only ever uses typed, parameterized ORM expressions.
"""

from __future__ import annotations

import re
import time
import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import asc, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.ai.base import BaseLLMProvider
from app.ai.prompt_service import PromptService
from app.ai.response_validator import ResponseValidator
from app.engines.recommendation import recommend
from app.models.company import Company, CompanyMetrics
from app.repositories import screener_repository
from app.schemas.screener import (
    ScreenerFilter,
    ScreenerRequest,
    ScreenerResponse,
    ScreenerResultItem,
    SortField,
)
from app.utils import cache as cache_util

_SORT_COLUMNS: dict[SortField, Any] = {
    "overall_score": CompanyMetrics.overall_score,
    "fundamental_score": CompanyMetrics.fundamental_score,
    "technical_score": CompanyMetrics.technical_score,
    "risk_score": CompanyMetrics.risk_score,
    "market_cap": CompanyMetrics.market_cap,
    "price": CompanyMetrics.price,
    "pe_ratio": CompanyMetrics.pe_ratio,
    "roe": CompanyMetrics.roe,
    "revenue_growth": CompanyMetrics.revenue_growth,
}

_SECTOR_KEYWORDS = {
    "technology": "Technology", "it": "Technology", "tech": "Technology",
    "software": "Technology", "financial": "Financials", "bank": "Financials",
    "banking": "Financials", "energy": "Energy", "oil": "Energy",
    "consumer": "Consumer Staples", "fmcg": "Consumer Staples",
    "industrial": "Industrials", "healthcare": "Healthcare",
}


class ScreenerService:
    """Orchestrates screening requests."""

    def __init__(self) -> None:
        self._prompt = PromptService()
        self._validator = ResponseValidator()

    async def query(
        self,
        db: AsyncSession,
        llm_provider: BaseLLMProvider,
        user_id: uuid.UUID,
        request: ScreenerRequest,
    ) -> ScreenerResponse:
        start = time.monotonic()

        filter_obj = request.filters
        if request.natural_language:
            nl_filter = await self._nl_to_filter(llm_provider, request.natural_language)
            filter_obj = self._merge_filters(filter_obj, nl_filter)

        cache_key = cache_util.screener_key(filter_obj.model_dump(mode="json"))
        cached = await cache_util.cache.get_json(cache_key)
        if cached is not None:
            return ScreenerResponse.model_validate(cached)

        rows = await self._execute(db, filter_obj, request)
        results = [
            ScreenerResultItem(
                rank=i + 1,
                ticker=ticker, name=name, exchange=exchange, sector=sector,
                market_cap=mcap, price=price,
                fundamental_score=float(fs or 0), technical_score=float(ts or 0),
                risk_score=float(rs or 0), overall_score=float(os or 0),
                recommendation=recommend(float(os)) if os is not None else None,
            )
            for i, (_, ticker, name, exchange, sector, mcap, price, fs, ts, rs, os) in enumerate(rows)
        ]

        # Persist for audit + re-run.
        query = await screener_repository.create_query(
            db,
            user_id=user_id,
            structured_filter=filter_obj.model_dump(mode="json"),
            natural_language=request.natural_language,
            result_count=len(results),
            execution_ms=int((time.monotonic() - start) * 1000),
        )
        await screener_repository.create_results(
            db, query,
            [
                {
                    "company_id": row[0],
                    "rank": idx + 1,
                    "fundamental_score": float(row[7] or 0),
                    "technical_score": float(row[8] or 0),
                    "risk_score": float(row[9] or 0),
                    "overall_score": float(row[10] or 0),
                }
                for idx, row in enumerate(rows)
            ],
        )
        await db.commit()

        response = ScreenerResponse(
            query_id=query.id,
            applied_filters=self._json_safe(filter_obj.model_dump()),
            count=len(results),
            limit=request.limit,
            offset=request.offset,
            results=results,
        )
        await cache_util.cache.set_json(cache_key, response.model_dump(mode="json"),
                                        ttl=cache_util.TTLS["screener"])
        return response

    # -- safe query builder (ORM only) ------------------------------------------
    async def _execute(
        self, db: AsyncSession, filter_obj: ScreenerFilter, request: ScreenerRequest
    ) -> list[Any]:
        stmt: Select = (
            select(
                Company.id,
                Company.ticker, Company.name, Company.exchange, Company.sector,
                CompanyMetrics.market_cap, CompanyMetrics.price,
                CompanyMetrics.fundamental_score, CompanyMetrics.technical_score,
                CompanyMetrics.risk_score, CompanyMetrics.overall_score,
            )
            .join(CompanyMetrics, CompanyMetrics.company_id == Company.id)
            .where(Company.is_enabled.is_(True))
        )

        f = filter_obj
        if f.sector:
            stmt = stmt.where(Company.sector == f.sector)
        if f.exchange:
            stmt = stmt.where(Company.exchange == f.exchange.upper())
        stmt = self._add_range(stmt, CompanyMetrics.market_cap, f.market_cap_min, f.market_cap_max)
        stmt = self._add_range(stmt, CompanyMetrics.pe_ratio, f.pe_ratio_min, f.pe_ratio_max)
        stmt = self._add_range(stmt, CompanyMetrics.roe, f.roe_min, f.roe_max)
        stmt = self._add_range(stmt, CompanyMetrics.revenue_growth, f.revenue_growth_min, f.revenue_growth_max)
        stmt = self._add_range(stmt, CompanyMetrics.debt_to_equity, f.debt_to_equity_min, f.debt_to_equity_max)
        stmt = self._add_range(stmt, CompanyMetrics.fundamental_score, f.fundamental_score_min, f.fundamental_score_max)
        stmt = self._add_range(stmt, CompanyMetrics.technical_score, f.technical_score_min, f.technical_score_max)
        stmt = self._add_range(stmt, CompanyMetrics.risk_score, f.risk_score_min, f.risk_score_max)
        stmt = self._add_range(stmt, CompanyMetrics.overall_score, f.overall_score_min, f.overall_score_max)

        sort_col = _SORT_COLUMNS.get(request.sort_by, CompanyMetrics.overall_score)
        order_fn = asc if request.order == "asc" else desc
        stmt = stmt.order_by(order_fn(sort_col)).limit(request.limit).offset(request.offset)

        result = await db.execute(stmt)
        return list(result.all())

    @staticmethod
    def _json_safe(data: dict[str, Any]) -> dict[str, Any]:
        """Convert Decimals to floats for a JSON-number API response (§19.2.5)."""
        return {
            k: (float(v) if isinstance(v, Decimal) else v)
            for k, v in data.items()
        }

    @staticmethod
    def _add_range(stmt: Select, column: Any, lo: Decimal | None, hi: Decimal | None) -> Select:
        if lo is not None:
            stmt = stmt.where(column >= lo)
        if hi is not None:
            stmt = stmt.where(column <= hi)
        return stmt

    # -- NL → filter --------------------------------------------------------------
    async def _nl_to_filter(self, llm_provider: BaseLLMProvider, nl: str) -> ScreenerFilter:
        messages = self._prompt.build_nl_screener_messages(nl)
        # Try LLM with one corrective retry.
        for attempt in (0, 1):
            try:
                content = (await llm_provider.generate(messages, json_mode=True)).content
                parsed = self._validator.validate_screener_filter(content)
                # An empty/irrelevant filter means the model didn't produce a
                # usable filter — fall back to the keyword parser.
                if parsed.is_empty:
                    break
                return parsed
            except Exception:  # noqa: BLE001 - retry/fallback
                if attempt == 0:
                    messages = [
                        messages[0],
                        {
                            "role": "user",
                            "content": (
                                f"Your previous output was invalid. Return ONLY a JSON object using the "
                                f"allowed keys. Request: {nl}"
                            ),
                        },
                    ]
                continue
        # Deterministic keyword fallback so the demo works offline.
        return self._keyword_filter(nl)

    @staticmethod
    def _merge_filters(structured: ScreenerFilter, nl: ScreenerFilter) -> ScreenerFilter:
        """Structured filters refine the NL-derived filter."""
        merged = nl.model_copy(deep=True)
        for key, value in structured.model_dump().items():
            if value is not None:
                setattr(merged, key, value)
        return merged

    @staticmethod
    def _keyword_filter(nl: str) -> ScreenerFilter:
        text = nl.lower()
        data: dict[str, Any] = {}
        for keyword, sector in _SECTOR_KEYWORDS.items():
            if keyword in text:
                data["sector"] = sector
                break
        m = re.search(r"roe\s*(?:above|greater than|>|of|of)\s*(\d+(?:\.\d+)?)", text)
        if m:
            data["roe_min"] = Decimal(m.group(1))
        m = re.search(r"roe\s*(?:below|less than|<)\s*(\d+(?:\.\d+)?)", text)
        if m:
            data["roe_max"] = Decimal(m.group(1))
        if "low debt" in text or "low leverage" in text or "debt" in text:
            data["debt_to_equity_max"] = Decimal("1")
        if "large cap" in text or "large-cap" in text:
            data["market_cap_min"] = Decimal("200000000000")
        if "fundamentally strong" in text or "strong fundamentals" in text:
            data["fundamental_score_min"] = Decimal("70")
        return ScreenerFilter(**{k: v for k, v in data.items() if v is not None})


screener_service = ScreenerService()
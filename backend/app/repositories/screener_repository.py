"""Data access for ``screening_queries`` and ``screening_results``."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.screener import ScreeningQuery, ScreeningResult


async def create_query(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    structured_filter: dict[str, Any],
    natural_language: str | None,
    result_count: int | None,
    execution_ms: int | None,
) -> ScreeningQuery:
    query = ScreeningQuery(
        user_id=user_id,
        structured_filter=structured_filter,
        natural_language=natural_language,
        result_count=result_count,
        execution_ms=execution_ms,
    )
    session.add(query)
    await session.flush()
    return query


async def create_results(session: AsyncSession, query: ScreeningQuery, results: list[dict[str, Any]]) -> None:
    for row in results:
        session.add(
            ScreeningResult(
                screening_query_id=query.id,
                company_id=row["company_id"],
                rank=row["rank"],
                fundamental_score=row["fundamental_score"],
                technical_score=row["technical_score"],
                risk_score=row["risk_score"],
                overall_score=row["overall_score"],
            )
        )
    await session.flush()
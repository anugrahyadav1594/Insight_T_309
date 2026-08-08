"""Generic CRUD helpers for repositories.

Repositories are the only layer that touches the ORM (ARCHITECTURE.md §3.1).
"""

from __future__ import annotations

import uuid
from typing import Any, TypeVar

from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

ModelT = TypeVar("ModelT")


async def get_by_id(session: AsyncSession, model: type[ModelT], pk: uuid.UUID) -> ModelT | None:
    return await session.get(model, pk)


async def get_by_key(session: AsyncSession, model: type[ModelT], **kwargs: Any) -> ModelT | None:
    stmt = select(model).filter_by(**kwargs).limit(1)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_query(session: AsyncSession, stmt: Select) -> list[Any]:
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def commit_refresh(session: AsyncSession, obj: Any) -> Any:
    """Commit and refresh ``obj``; returns it."""
    await session.commit()
    await session.refresh(obj)
    return obj


async def flush_refresh(session: AsyncSession, obj: Any) -> Any:
    """Flush and refresh ``obj`` without committing (for use inside transactions)."""
    await session.flush()
    await session.refresh(obj)
    return obj
"""Pagination helpers for list endpoints."""

from __future__ import annotations

from app.core.constants import DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT


def normalize_limit_offset(limit: int | None, offset: int | None) -> tuple[int, int]:
    """Clamp ``limit`` into [1, MAX_LIST_LIMIT] and ``offset`` >= 0."""
    limit = max(1, min(limit or DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT))
    offset = max(0, offset or 0)
    return limit, offset
"""Shared Pydantic DTOs: error envelope, pagination and generic helpers."""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Error envelope body (§17.1)."""

    code: str
    message: str
    details: Any | None = None
    request_id: str | None = None

    model_config = ConfigDict(extra="forbid")


class SuccessEnvelope(BaseModel, Generic[T]):
    """Generic success envelope: ``{"success": true, "data": ...}``."""

    success: bool = True
    data: T


class ErrorEnvelope(BaseModel):
    """Generic error envelope: ``{"success": false, "error": {...}}``."""

    success: bool = False
    error: ErrorDetail


class Paginated(BaseModel, Generic[T]):
    """Standard pagination payload (§18.1)."""

    items: list[T]
    total: int
    limit: int
    offset: int


class MessageResponse(BaseModel):
    """A simple ``{message: str}`` response."""

    message: str


def ok(data: T) -> dict[str, T]:
    """Build a success envelope body: ``{"success": True, "data": data}``."""
    return {"success": True, "data": data}
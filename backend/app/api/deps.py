"""FastAPI dependencies (ARCHITECTURE.md §5.4).

* ``get_current_user`` — JWT auth dependency (401 with the documented codes).
* ``get_optional_user`` — same but returns ``None`` for public probes.
* Provider / cache / dispatcher dependencies used by routes.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    TokenExpiredError,
    TokenInvalidError,
    TokenMissingError,
)
from app.core import security
from app.db.session import get_db
from app.integrations.market_data.base import BaseMarketDataProvider
from app.integrations.market_data.factory import get_market_data_provider
from app.ai.base import BaseLLMProvider
from app.ai.factory import get_llm_provider
from app.repositories import user_repository
from app.utils.cache import Cache, cache

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    """Authenticated user injected into protected routes."""

    id: uuid.UUID
    email: str
    full_name: str


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise TokenMissingError()
    try:
        payload = security.decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError() from exc
    except jwt.PyJWTError as exc:
        raise TokenInvalidError() from exc

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        raise TokenInvalidError()
    try:
        user_id = uuid.UUID(user_id_raw)
    except (ValueError, TypeError) as exc:
        raise TokenInvalidError() from exc

    user = await user_repository.get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise TokenInvalidError()
    return CurrentUser(id=user.id, email=user.email, full_name=user.full_name)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser | None:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials=credentials, db=db)
    except Exception:  # noqa: BLE001
        return None


def get_provider() -> BaseMarketDataProvider:
    return get_market_data_provider()


def get_llm() -> BaseLLMProvider:
    return get_llm_provider()


def get_cache() -> Cache:
    return cache


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")
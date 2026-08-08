"""Authentication endpoints (§5, §18.3)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_current_user
from app.core.config import settings
from app.core.rate_limits import rate_limit
from app.db.session import get_db
from app.repositories import user_repository
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    MeResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    TokenRefreshResponse,
)
from app.schemas.common import SuccessEnvelope, ok
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=SuccessEnvelope[TokenPair],
    status_code=status.HTTP_201_CREATED,
)
@rate_limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> dict:
    result = await AuthService().register(
        db, email=body.email, password=body.password, full_name=body.full_name
    )
    return ok(result)


@router.post("/login", response_model=SuccessEnvelope[TokenPair])
@rate_limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    result = await AuthService().login(db, email=body.email, password=body.password)
    return ok(result)


@router.post("/refresh", response_model=SuccessEnvelope[TokenRefreshResponse])
@rate_limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")
async def refresh(request: Request, body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> dict:
    result = await AuthService().refresh(db, refresh_token=body.refresh_token)
    return ok(result)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: LogoutRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await AuthService().logout(db, refresh_token=body.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=SuccessEnvelope[MeResponse])
async def me(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await user_repository.get_user_by_id(db, current_user.id)
    result = await AuthService().me(user)
    return ok(result)
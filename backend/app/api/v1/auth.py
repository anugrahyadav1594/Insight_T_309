"""Authentication endpoints (§5, §18.3)."""

from __future__ import annotations

import urllib.parse

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import RedirectResponse
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
from app.services.google_oauth_service import google_oauth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/authorize")
async def google_authorize(next: str | None = None) -> Response:
    """Build the Google login URL and redirect the browser to it.

    Returns a 307 redirect to Google's consent screen.
    """
    url = google_oauth_service.authorize_url(next_path=next)
    return RedirectResponse(url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/google/callback", include_in_schema=True)
async def google_callback(
    request: Request,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """OAuth callback from Google.

    Exchanges the code, finds-or-creates the user, issues our JWT pair, and
    redirects the browser to the frontend callback URL with the tokens.
    """
    result = await google_oauth_service.callback(
        db, code=code, state=state, next_path=None
    )
    next_uri = result["next"]
    params = urllib.parse.urlencode(
        {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "expires_in": result["expires_in"],
        }
    )
    redirect_target = f"{settings.GOOGLE_FRONTEND_REDIRECT_URI}?{params}"
    if next_uri and next_uri != "/":
        redirect_target += f"&next={urllib.parse.quote(next_uri)}"
    return RedirectResponse(redirect_target, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


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
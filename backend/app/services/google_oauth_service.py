"""Google OAuth (Authorization Code + redirect) service.

Flow (ARCHITECTURE-style, provider-agnostic auth extension):
1. Frontend calls ``GET /auth/google/authorize`` -> backend redirects to Google.
2. Google redirects back to ``GOOGLE_REDIRECT_URI`` with ``code`` + ``state``.
3. Backend exchanges ``code`` for tokens, fetches the user profile from Google.
4. Backend finds-or-creates the local user (linking by ``oauth_accounts``),
   issues our JWT access/refresh pair, and redirects the browser to
   ``GOOGLE_FRONTEND_REDIRECT_URI`` with the tokens in the URL query string.
"""

from __future__ import annotations

import logging
import urllib.parse
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import (
    ForbiddenError,
    InternalError,
)
from app.core import security
from app.models.user import User
from app.repositories import user_repository

logger = logging.getLogger("insight.oauth")

_GOOGLE_PROVIDER = "google"


class GoogleOAuthService:
    """Handles the Google sign-in flow."""

    @property
    def configured(self) -> bool:
        return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)

    def authorize_url(self, next_path: str | None = None) -> str:
        """Build the Google authorization URL (redirect the browser here)."""
        if not self.configured:
            raise InternalError("Google OAuth is not configured (missing client id/secret)")
        state = security.create_oauth_state(next_path)
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": settings.GOOGLE_SCOPES,
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
        return f"{settings.GOOGLE_AUTH_URI}?{urllib.parse.urlencode(params)}"

    async def _exchange_code(self, code: str) -> dict[str, Any]:
        """Exchange the authorization code for Google access/id tokens."""
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        try:
            async with httpx.AsyncClient(timeout=settings.FMP_TIMEOUT_SECONDS) as client:
                resp = await client.post(settings.GOOGLE_TOKEN_URI, data=data)
        except Exception as exc:  # noqa: BLE001
            logger.warning("google token exchange failed: %s", exc)
            raise ForbiddenError() from exc
        if resp.status_code != 200:
            logger.warning("google token exchange HTTP %s", resp.status_code)
            raise ForbiddenError()
        try:
            return resp.json()
        except ValueError as exc:  # noqa: BLE001
            raise ForbiddenError() from exc

    async def _get_userinfo(self, access_token: str) -> dict[str, Any]:
        """Fetch the Google profile (email, name, sub) using the access token."""
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            async with httpx.AsyncClient(timeout=settings.FMP_TIMEOUT_SECONDS) as client:
                resp = await client.get(settings.GOOGLE_USERINFO_URI, headers=headers)
        except Exception as exc:  # noqa: BLE001
            logger.warning("google userinfo failed: %s", exc)
            raise ForbiddenError() from exc
        if resp.status_code != 200:
            raise ForbiddenError()
        try:
            return resp.json()
        except ValueError as exc:  # noqa: BLE001
            raise ForbiddenError() from exc

    async def _find_or_create_user(self, db, info: dict[str, Any]) -> User:
        sub = str(info.get("sub", ""))
        if not sub:
            raise ForbiddenError()
        email = (info.get("email") or "").lower().strip() or None
        name = (info.get("name") or "Google User").strip() or "Google User"

        # 1. Already linked?
        acct = await user_repository.get_oauth_account(db, _GOOGLE_PROVIDER, sub)
        if acct is not None:
            user = await user_repository.get_user_by_id(db, acct.user_id)
            if user is None or not user.is_active:
                raise ForbiddenError()
            return user

        # 2. User already exists with this email (email/password registration)?
        user = await user_repository.get_user_by_email(db, email) if email else None
        if user is None:
            # 3. Create a brand-new user (no local password for OAuth-only).
            user = await user_repository.create_user(
                db, email=email or f"google_{sub}@users.noreply",
                password_hash=None, full_name=name,
            )

        await user_repository.create_oauth_account(
            db, user_id=user.id, provider=_GOOGLE_PROVIDER,
            provider_user_id=sub, email=email,
        )
        await db.commit()
        await db.refresh(user)
        return user

    async def callback(
        self,
        db,
        *,
        code: str,
        state: str,
        next_path: str | None = None,
    ) -> dict[str, str]:
        """Complete the Google login and return our token pair.

        ``next_path`` is the validated (allow-listed) frontend redirect path,
        or falls back to the value encoded in the OAuth state.
        """
        if not self.configured:
            raise InternalError("Google OAuth is not configured")
        # Verify state (CSRF) — raises on invalid/expired.
        try:
            payload = security.verify_oauth_state(state)
        except Exception as exc:  # noqa: BLE001
            logger.warning("oauth state verification failed: %s", exc)
            raise ForbiddenError() from exc
        if not next_path:
            next_path = payload.get("next", "/")

        tokens = await self._exchange_code(code)
        access_token = tokens.get("access_token")
        if not access_token:
            logger.warning("google returned no access_token")
            raise ForbiddenError()

        info = await self._get_userinfo(access_token)
        user = await self._find_or_create_user(db, info)
        await user_repository.touch_last_login(db, user)

        our_access = security.create_access_token(user.id)
        raw_refresh, token_hash = security.generate_refresh_token()
        await self._issue_refresh(db, user, token_hash)
        await db.commit()

        return {
            "access_token": our_access,
            "refresh_token": raw_refresh,
            "expires_in": str(settings.access_token_ttl_seconds),
            "next": next_path,
        }

    async def _issue_refresh(self, db, user: User, token_hash: str) -> None:
        from app.repositories import token_repository

        await token_repository.create_refresh_token(
            db,
            user_id=user.id,
            token_hash=token_hash,
            family_id=security.new_family_id(),
            expires_at=security.token_expiry(),
        )


google_oauth_service = GoogleOAuthService()
"""Authentication flows: register / login / refresh / logout (ARCHITECTURE.md §5)."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
)
from app.core import security
from app.models.user import User
from app.repositories import token_repository, user_repository
from app.schemas.auth import (
    MeResponse,
    TokenPair,
    TokenRefreshResponse,
    UserOut,
)


async def _build_token_pair(db: AsyncSession, user: User) -> tuple[str, str, int]:
    """Create an access token and a rotating refresh-token row."""
    access_token = security.create_access_token(user.id)
    raw_refresh, token_hash = security.generate_refresh_token()
    await token_repository.create_refresh_token(
        db,
        user_id=user.id,
        token_hash=token_hash,
        family_id=security.new_family_id(),
        expires_at=security.token_expiry(),
    )
    return access_token, raw_refresh, settings.access_token_ttl_seconds


class AuthService:
    """Orchestrates authentication use-cases."""

    async def register(
        self, db: AsyncSession, *, email: str, password: str, full_name: str
    ) -> TokenPair:
        email = email.lower().strip()
        existing = await user_repository.get_user_by_email(db, email)
        if existing is not None:
            raise EmailAlreadyRegisteredError()

        password_hash = security.hash_password(password)
        try:
            user = await user_repository.create_user(
                db, email=email, password_hash=password_hash, full_name=full_name
            )
        except IntegrityError:
            await db.rollback()
            raise EmailAlreadyRegisteredError() from None

        access_token, raw_refresh, expires_in = await _build_token_pair(db, user)
        await db.commit()
        return TokenPair(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=expires_in,
            user=UserOut.model_validate(user),
        )

    async def login(self, db: AsyncSession, *, email: str, password: str) -> TokenPair:
        user = await user_repository.get_user_by_email(db, email)
        if user is None or not user.is_active:
            raise InvalidCredentialsError()
        if not security.verify_password(password, user.password_hash):
            raise InvalidCredentialsError()
        await user_repository.touch_last_login(db, user)

        access_token, raw_refresh, expires_in = await _build_token_pair(db, user)
        await db.commit()
        return TokenPair(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=expires_in,
            user=UserOut.model_validate(user),
        )

    async def refresh(self, db: AsyncSession, *, refresh_token: str) -> TokenRefreshResponse:
        token_hash = security.hash_refresh_token(refresh_token)
        token = await token_repository.get_by_hash(db, token_hash)
        if token is None:
            raise InvalidRefreshTokenError()
        if token.revoked_at is not None:
            # A revoked token was presented again -> possible theft -> revoke family.
            await token_repository.revoke_family(db, token.family_id)
            raise InvalidRefreshTokenError()
        if token.expires_at < datetime.now(timezone.utc):
            raise InvalidRefreshTokenError()

        # Rotate: revoke old, issue new with the same family.
        await token_repository.revoke_token(db, token)
        user = await user_repository.get_user_by_id(db, token.user_id)
        if user is None or not user.is_active:
            raise InvalidRefreshTokenError()

        access_token = security.create_access_token(user.id)
        raw_refresh, new_hash = security.generate_refresh_token()
        await token_repository.create_refresh_token(
            db,
            user_id=user.id,
            token_hash=new_hash,
            family_id=token.family_id,
            expires_at=security.token_expiry(),
        )
        await db.commit()
        return TokenRefreshResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=settings.access_token_ttl_seconds,
        )

    async def logout(self, db: AsyncSession, *, refresh_token: str) -> None:
        token_hash = security.hash_refresh_token(refresh_token)
        token = await token_repository.get_by_hash(db, token_hash)
        if token is not None and token.revoked_at is None:
            await token_repository.revoke_token(db, token)

    async def me(self, user: User) -> MeResponse:
        return MeResponse.model_validate(user)
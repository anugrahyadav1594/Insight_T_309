"""Data access for ``refresh_tokens`` (rotation + family reuse detection)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import RefreshToken


async def create_refresh_token(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    token_hash: str,
    family_id: uuid.UUID,
    expires_at: datetime,
) -> RefreshToken:
    token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=expires_at,
    )
    session.add(token)
    await session.flush()
    return token


async def get_by_hash(session: AsyncSession, token_hash: str) -> RefreshToken | None:
    result = await session.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash).limit(1))
    return result.scalar_one_or_none()


async def revoke_token(session: AsyncSession, token: RefreshToken) -> None:
    token.revoked_at = datetime.now(timezone.utc)
    await session.commit()


async def revoke_family(session: AsyncSession, family_id: uuid.UUID) -> None:
    """Revoke every token in a family (reuse-detection escalation)."""
    now = datetime.now(timezone.utc)
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id)
        .values(revoked_at=now)
    )
    await session.commit()
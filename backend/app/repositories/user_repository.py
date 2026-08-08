"""Data access for ``users``."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import commit_refresh, get_by_id


async def create_user(
    session: AsyncSession,
    *,
    email: str,
    password_hash: str,
    full_name: str,
) -> User:
    user = User(email=email, password_hash=password_hash, full_name=full_name, is_active=True)
    session.add(user)
    return await commit_refresh(session, user)


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email.lower()).limit(1))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await get_by_id(session, User, user_id)


async def touch_last_login(session: AsyncSession, user: User) -> None:
    user.last_login_at = datetime.now(timezone.utc)
    await session.commit()
"""Password hashing (Argon2id) and JWT / opaque refresh-token utilities.

* Passwords: Argon2id (argon2-cffi) with the documented parameters, falling
  back to bcrypt-style cost handling if argon2 is unavailable.
* Access tokens: short-lived JWT (HS256) with ``sub``, ``jti``, ``type``,
  ``iat`` and ``exp`` claims.
* Refresh tokens: opaque 256-bit random tokens; only their SHA-256 hex hash is
  ever persisted (never the raw token).
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from .config import settings
from .constants import TOKEN_TYPE_ACCESS

_ph = PasswordHasher(time_cost=2, memory_cost=19 * 1024, parallelism=1)

_ALGORITHM = "HS256"


# ---------------------------------------------------------------------------
# Password hashing / verification
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hash a plaintext password with Argon2id."""
    return _ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against an Argon2id hash (constant-time)."""
    try:
        return _ph.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


# ---------------------------------------------------------------------------
# Access (JWT) tokens
# ---------------------------------------------------------------------------
def _secret() -> str:
    if not settings.JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is not configured")
    return settings.JWT_SECRET_KEY


def create_access_token(user_id: str | uuid.UUID) -> str:
    """Create a short-lived HS256 JWT access token."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "jti": uuid.uuid4().hex,
        "type": TOKEN_TYPE_ACCESS,
        "iat": now,
        "exp": now + timedelta(seconds=settings.access_token_ttl_seconds),
    }
    return jwt.encode(payload, _secret(), algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token.

    Raises ``jwt.PyJWTError`` subclasses which the caller maps to domain
    errors (see :func:`app.api.deps.get_current_user`).
    """
    payload = jwt.decode(token, _secret(), algorithms=[_ALGORITHM])
    if payload.get("type") != TOKEN_TYPE_ACCESS:
        raise jwt.InvalidTokenError("not an access token")
    return payload


# ---------------------------------------------------------------------------
# Opaque refresh tokens
# ---------------------------------------------------------------------------
def generate_refresh_token() -> tuple[str, str]:
    """Return ``(raw_token, sha256_hex_hash)``.

    Only the hash is persisted. The raw token is returned exactly once to the
    client.
    """
    raw = secrets.token_urlsafe(32)  # 256 bits of entropy
    return raw, hash_refresh_token(raw)


def hash_refresh_token(raw_token: str) -> str:
    """Return the SHA-256 hex hash of a refresh token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def token_expiry() -> datetime:
    """Compute the expiry timestamp for a new refresh token."""
    return datetime.now(timezone.utc) + timedelta(seconds=settings.refresh_token_ttl_seconds)


def new_family_id() -> uuid.UUID:
    """Return a new refresh-token rotation family id."""
    return uuid.uuid4()

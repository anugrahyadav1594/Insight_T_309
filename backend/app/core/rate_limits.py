"""Shared slowapi rate limiter (ARCHITECTURE.md §22).

The limiter is a single shared instance so it can be registered on
``app.state.limiter``. Applying the decorators is conditional on
``RATE_LIMIT_ENABLED`` so tests and offline runs are never rate-limited and
never require a running Redis.

Storage: in-memory by default (reliable for the Phase-1 demo). To use Redis
storage, set ``RATE_LIMIT_STORAGE_URI`` (e.g. ``redis://redis:6379/0``) and
install ``limits[redis]``.
"""

from __future__ import annotations

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

_storage_uri = os.getenv("RATE_LIMIT_STORAGE_URI", "").strip()
if _storage_uri:
    limiter = Limiter(key_func=get_remote_address, storage_uri=_storage_uri)
else:
    limiter = Limiter(key_func=get_remote_address)


def rate_limit(rate: str):
    """Conditionally apply a slowapi rate limit.

    ``slowapi``'s decorator uses ``functools.wraps`` but does NOT copy the
    endpoint's ``__globals__``. With ``from __future__ import annotations``
    every type hint is a lazy ``ForwardRef``, which FastAPI resolves against
    ``call.__globals__`` — so it fails on the wrapped function and misclassifies
    Pydantic body models as query params. We fix this by copying the original
    function's globals onto the wrapper.
    """
    def decorator(func):
        if not settings.RATE_LIMIT_ENABLED:
            return func
        wrapped = limiter.limit(rate)(func)
        try:
            wrapped.__globals__.update(func.__globals__)
        except Exception:  # pragma: no cover - defensive
            pass
        return wrapped

    return decorator
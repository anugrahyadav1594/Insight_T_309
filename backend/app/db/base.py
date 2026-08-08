"""Re-exports of the declarative base and all ORM models.

Importing this module registers every model on ``Base.metadata`` so that
Alembic autogenerate and seed scripts can see the full schema.
"""

from __future__ import annotations

from app.models.base import Base
from app.models import (
    user,  # noqa: F401
    company,  # noqa: F401
    portfolio,  # noqa: F401
    watchlist,  # noqa: F401
    ai,  # noqa: F401
    screener,  # noqa: F401
)

__all__ = ["Base"]
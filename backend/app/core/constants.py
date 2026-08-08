"""Shared enums and default configuration constants.

These enums map to PostgreSQL native enums (see the initial Alembic migration)
and are reused across ORM models, Pydantic schemas and engines.
"""

from __future__ import annotations

import enum


class StrEnum(str, enum.Enum):
    """String-backed enum helper."""

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.value


class PeriodType(StrEnum):
    ANNUAL = "annual"
    QUARTERLY = "quarterly"


class UserRole(StrEnum):
    USER = "user"
    ADMIN = "admin"


class ReportType(StrEnum):
    COMPANY_ANALYSIS = "company_analysis"
    PORTFOLIO_ANALYSIS = "portfolio_analysis"


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Recommendation(StrEnum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    HOLD = "hold"
    NEUTRAL = "neutral"
    BEARISH = "bearish"


# Default recommendation bands. Each entry is (lower_inclusive, upper_inclusive, label).
DEFAULT_RECOMMENDATION_BANDS: list[tuple[int, int, str]] = [
    (90, 100, "STRONG_BUY"),
    (75, 89, "BUY"),
    (60, 74, "HOLD"),
    (40, 59, "NEUTRAL"),
    (0, 39, "BEARISH"),
]

# Recommendation band boundaries that the AI validator uses to OVERRIDE the
# LLM's proposed recommendation with the deterministic band.
RECOMMENDATION_ENUM_TO_BAND: dict[str, str] = {
    "STRONG_BUY": "STRONG_BUY",
    "BUY": "BUY",
    "HOLD": "HOLD",
    "NEUTRAL": "NEUTRAL",
    "BEARISH": "BEARISH",
    "strong_buy": "STRONG_BUY",
    "buy": "BUY",
    "hold": "HOLD",
    "neutral": "NEUTRAL",
    "bearish": "BEARISH",
}

# Data source strings stored on company_metrics.source
SOURCE_FMP = "fmp"
SOURCE_SEED = "seed"
SOURCE_MOCK = "mock"

# Company data_status values
DATA_STATUS_SEEDED = "seeded"
DATA_STATUS_SYNCED = "synced"
DATA_STATUS_PARTIAL = "partial"

# Default limit / offset bounds for list endpoints
DEFAULT_LIST_LIMIT = 25
MAX_LIST_LIMIT = 50

# Token claims
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"

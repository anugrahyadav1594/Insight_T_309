"""Centralized application exception hierarchy (see ARCHITECTURE.md §17).

Every domain error subclasses :class:`AppError` with a fixed machine-readable
``code``, a human ``message``, an ``HTTP status`` and optional structured
``details`` (e.g. per-field validation map).

These exceptions are converted to the standard error envelope by the global
exception handlers registered in :mod:`app.main`.
"""

from __future__ import annotations

from typing import Any, Mapping


class AppError(Exception):
    """Base application error."""

    code: str = "INTERNAL_ERROR"
    status_code: int = 500
    message: str = "An unexpected error occurred"
    details: Any = None

    def __init__(
        self,
        message: str | None = None,
        *,
        details: Any = None,
        code: str | None = None,
        status_code: int | None = None,
    ) -> None:
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code
        if message is not None:
            self.message = message
        if details is not None:
            self.details = details
        super().__init__(self.message)


# ---------------------------------------------------------------------------
# 400 - malformed request / bad parameter
# ---------------------------------------------------------------------------
class ValidationError(AppError):
    code = "VALIDATION_ERROR"
    status_code = 422
    message = "Request validation failed"

    def __init__(self, details: Mapping[str, list[str]] | None = None, *, message: str | None = None):
        super().__init__(message=message or self.message, details=details)


class BadRequestError(AppError):
    code = "INVALID_PARAMETER"
    status_code = 400
    message = "Bad request"


# ---------------------------------------------------------------------------
# 401 - authentication failures
# ---------------------------------------------------------------------------
class AuthError(AppError):
    code = "AUTH_ERROR"
    status_code = 401


class TokenMissingError(AuthError):
    code = "TOKEN_MISSING"
    message = "Authentication credentials were not provided"


class TokenInvalidError(AuthError):
    code = "TOKEN_INVALID"
    message = "Authentication token is invalid"


class TokenExpiredError(AuthError):
    code = "TOKEN_EXPIRED"
    message = "Authentication token has expired"


class InvalidCredentialsError(AuthError):
    code = "INVALID_CREDENTIALS"
    message = "Invalid email or password"


class InvalidRefreshTokenError(AuthError):
    code = "INVALID_REFRESH_TOKEN"
    message = "Refresh token is invalid, expired or revoked"


# ---------------------------------------------------------------------------
# 403 - authorized but not allowed
# ---------------------------------------------------------------------------
class ForbiddenError(AppError):
    code = "FORBIDDEN"
    status_code = 403
    message = "You do not have permission to access this resource"


# ---------------------------------------------------------------------------
# 404 - resource not found
# ---------------------------------------------------------------------------
class NotFoundError(AppError):
    code = "NOT_FOUND"
    status_code = 404
    message = "Resource not found"


class CompanyNotFoundError(NotFoundError):
    code = "COMPANY_NOT_FOUND"
    message = "Company was not found"

    def __init__(self, ticker: str | None = None):
        if ticker:
            super().__init__(message=f"Company {ticker} was not found")
        else:
            super().__init__()


class PortfolioNotFoundError(NotFoundError):
    code = "PORTFOLIO_NOT_FOUND"
    message = "Portfolio was not found"


class WatchlistNotFoundError(NotFoundError):
    code = "WATCHLIST_NOT_FOUND"
    message = "Watchlist was not found"


class HoldingNotFoundError(NotFoundError):
    code = "HOLDING_NOT_FOUND"
    message = "Holding was not found"


class ItemNotFoundError(NotFoundError):
    code = "ITEM_NOT_FOUND"
    message = "Watchlist item was not found"


class ConversationNotFoundError(NotFoundError):
    code = "CONVERSATION_NOT_FOUND"
    message = "Conversation was not found"


# ---------------------------------------------------------------------------
# 409 - state conflict
# ---------------------------------------------------------------------------
class ConflictError(AppError):
    code = "CONFLICT"
    status_code = 409


class EmailAlreadyRegisteredError(ConflictError):
    code = "EMAIL_ALREADY_REGISTERED"
    message = "An account with this email already exists"


class HoldingExistsError(ConflictError):
    code = "HOLDING_EXISTS"
    message = "This ticker is already in the portfolio"


class ItemExistsError(ConflictError):
    code = "ITEM_EXISTS"
    message = "This ticker is already in the watchlist"


# ---------------------------------------------------------------------------
# 429 - rate limited
# ---------------------------------------------------------------------------
class RateLimitError(AppError):
    code = "RATE_LIMITED"
    status_code = 429
    message = "Too many requests. Please slow down."

    def __init__(self, retry_after: int | None = None, **kwargs: Any):
        super().__init__(**kwargs)
        self.retry_after = retry_after


# ---------------------------------------------------------------------------
# 503 - external dependency down
# ---------------------------------------------------------------------------
class ServiceUnavailableError(AppError):
    code = "SERVICE_UNAVAILABLE"
    status_code = 503
    message = "Service is temporarily unavailable"


class MarketDataUnavailableError(ServiceUnavailableError):
    code = "MARKET_DATA_UNAVAILABLE"
    message = "Market data is temporarily unavailable. Please try again."


class AIUnavailableError(ServiceUnavailableError):
    code = "AI_UNAVAILABLE"
    message = "AI service is temporarily unavailable. Please try again."


class DatabaseUnavailableError(ServiceUnavailableError):
    code = "DATABASE_UNAVAILABLE"
    message = "Database is temporarily unavailable"


class RedisUnavailableError(ServiceUnavailableError):
    code = "REDIS_UNAVAILABLE"
    message = "Cache service is temporarily unavailable"


# ---------------------------------------------------------------------------
# 500 - internal
# ---------------------------------------------------------------------------
class InternalError(AppError):
    code = "INTERNAL_ERROR"
    status_code = 500
    message = "An unexpected internal error occurred"


# Alias kept short for convenience inside services/repositories.
CompanyNotFound = CompanyNotFoundError
PortfolioNotFound = PortfolioNotFoundError
WatchlistNotFound = WatchlistNotFoundError
HoldingNotFound = HoldingNotFoundError
ItemNotFound = ItemNotFoundError
ConversationNotFound = ConversationNotFoundError
EmailAlreadyRegistered = EmailAlreadyRegisteredError
HoldingExists = HoldingExistsError
ItemExists = ItemExistsError
MarketDataUnavailable = MarketDataUnavailableError
AIUnavailable = AIUnavailableError

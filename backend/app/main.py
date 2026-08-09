"""INSIGHT FastAPI application factory (ARCHITECTURE.md §3, §17).

* App factory + lifespan (logging init, rate-limit state, cache cleanup).
* Global exception handlers converting domain errors to the error envelope.
* Never exposes stack traces or internals in responses.
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError

from app.api.middleware import setup_middleware
from app.api.router import api_router, root_router
from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.core.rate_limits import limiter
from app.utils.cache import cache

logger = logging.getLogger("insight")


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")


def _error_response(
    status_code: int,
    code: str,
    message: str,
    request_id: str,
    details: Any = None,
    retry_after: int | None = None,
) -> JSONResponse:
    headers = {"X-Request-ID": request_id}
    if retry_after is not None:
        headers["Retry-After"] = str(retry_after)
    return JSONResponse(
        status_code=status_code,
        headers=headers,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
                "request_id": request_id,
            },
        },
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    app.state.limiter = limiter
    logger.info("%s starting (env=%s)", settings.APP_NAME, settings.ENVIRONMENT)

    # Start the scheduled auto-refresh background task (no-op if disabled).
    scheduler_task = None
    if settings.AUTO_REFRESH_ENABLED:
        from app.workers.scheduler import _scheduler_task

        scheduler_task = _scheduler_task()
        if scheduler_task is not None:
            logger.info("auto-refresh scheduler task scheduled")

    yield

    if scheduler_task is not None:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            pass
        except Exception:  # noqa: BLE001
            logger.warning("scheduler task shutdown error", exc_info=True)
    await cache.close()
    logger.info("%s shutdown", settings.APP_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.APP_NAME} API",
        description=(
            "AI-powered financial intelligence platform for Indian retail investors.\n\n"
            "## Quick start (demo user)\n"
            "Login: `demo@insight.com` / `Demo@12345`\n\n"
            "## Live market data (FMP)\n"
            "When `MARKET_DATA_PROVIDER=fmp` and a valid `FMP_API_KEY` is set, calls to "
            "`/companies/{ticker}` and `/companies/movers/list` pull **real** prices and "
            "fundamentals from Financial Modeling Prep. Data is cached (Redis) then stored "
            "(PostgreSQL) before serving.\n\n"
            "## Test use-cases (run these in order)\n"
            "1. **Auth** — `POST /api/v1/auth/login` (demo credentials above) → copy `access_token`.\n"
            "2. **Authorize** — click **Authorize** and paste `Bearer <access_token>`.\n"
            "3. **Live analysis** — `GET /api/v1/companies/TCS` → real FMP price, scores, AI summary.\n"
            "4. **Gainers/Losers** — `GET /api/v1/companies/movers/list?period=1D&direction=gainers`.\n"
            "5. **IPO calendar** — `GET /api/v1/ipos` (ongoing / upcoming / ended).\n"
            "6. **Screener** — `POST /api/v1/screener/query` (structured or natural language).\n"
            "7. **AI chat** — `POST /api/v1/ai/chat` (grounded in company data).\n"
            "8. **Portfolio** — create, add a holding, `POST /.../analyze`.\n\n"
            "### Updating / refreshing data\n"
            "Run `python -m scripts.refresh_all` (in the container) to pull fresh FMP data for all "
            "companies. Individual analysis calls auto-refresh when cached data is stale "
            "(quotes > 15 min, profiles > 24 h)."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        openapi_tags=[
            {"name": "system", "description": "Liveness & dependency health"},
            {"name": "auth", "description": "Register, login, refresh, logout, me"},
            {"name": "companies", "description": "Search, analysis, gainers/losers (movers)"},
            {"name": "ipos", "description": "IPO calendar (ongoing / upcoming / ended)"},
            {"name": "dashboard", "description": "Single aggregated home payload"},
            {"name": "portfolios", "description": "Portfolio CRUD, holdings math, AI analysis"},
            {"name": "watchlists", "description": "Watchlist CRUD with live enrichment"},
            {"name": "screener", "description": "Structured + natural-language stock screening"},
            {"name": "ai", "description": "Contextual AI chat grounded in backend data"},
        ],
    )

    setup_middleware(app)
    app.include_router(root_router)
    app.include_router(api_router)

    _register_exception_handlers(app)
    return app


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        return _error_response(
            exc.status_code,
            exc.code,
            exc.message,
            _request_id(request),
            exc.details,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        details: dict[str, list[str]] = {}
        for err in exc.errors():
            field = ".".join(str(part) for part in err.get("loc", []) if part not in ("body", "query", "path"))
            msg = err.get("msg", "invalid value")
            details.setdefault(field or "body", []).append(msg)
        return _error_response(422, "VALIDATION_ERROR", "Request validation failed",
                               _request_id(request), details)

    @app.exception_handler(RateLimitExceeded)
    async def ratelimit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        retry_after = 60
        try:
            retry_after = int(exc.retry_after)
        except (TypeError, ValueError, AttributeError):
            pass
        return _error_response(429, "RATE_LIMITED", "Too many requests. Please slow down.",
                               _request_id(request), retry_after=retry_after)

    @app.exception_handler(IntegrityError)
    async def integrity_handler(request: Request, exc: IntegrityError) -> JSONResponse:
        # Race-proof duplicate handling → generic conflict.
        logger.warning("integrity error on %s", request.url.path, exc_info=True)
        return _error_response(409, "CONFLICT", "A conflicting record already exists.",
                               _request_id(request))

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
        # Log the full trace server-side only; never leak it to the client.
        logger.exception("unhandled error on %s", request.url.path, exc_info=exc)
        return _error_response(500, "INTERNAL_ERROR",
                               "An unexpected internal error occurred", _request_id(request))


app = create_app()
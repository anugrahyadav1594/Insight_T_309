"""Middleware: request-id, CORS and request logging (ARCHITECTURE.md §8, §22)."""

from __future__ import annotations

import logging
import time
import uuid

from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request

from app.core.config import settings

logger = logging.getLogger("insight.http")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a UUID request id to every request/response and log it."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:24]
        request.state.request_id = request_id
        start = time.monotonic()
        try:
            response = await call_next(request)
        except Exception:
            logger.warning("request_id=%s unhandled error", request_id, exc_info=True)
            raise
        response.headers["X-Request-ID"] = request_id
        duration_ms = (time.monotonic() - start) * 1000
        logger.info(
            "request_id=%s method=%s path=%s status=%s duration_ms=%.1f",
            request_id, request.method, request.url.path, response.status_code, duration_ms,
        )
        return response


def setup_middleware(app: FastAPI) -> None:
    """Register CORS + request-id middleware on the app."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIDMiddleware)
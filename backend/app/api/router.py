"""Aggregates all v1 routers plus the root-level system router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import ai, auth, companies, dashboard, health, portfolios, screener, watchlists

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(companies.router)
api_router.include_router(dashboard.router)
api_router.include_router(portfolios.router)
api_router.include_router(watchlists.router)
api_router.include_router(screener.router)
api_router.include_router(ai.router)

root_router = APIRouter()
root_router.include_router(health.router)
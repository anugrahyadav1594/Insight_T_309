"""Dashboard endpoint (§10, §18.5)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.common import SuccessEnvelope, ok
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter(tags=["dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/dashboard", response_model=SuccessEnvelope[DashboardResponse])
async def get_dashboard(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await dashboard_service.aggregate(db, current_user.id)
    return ok(result)
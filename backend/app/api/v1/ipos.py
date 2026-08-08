"""IPO calendar endpoint — ongoing / upcoming / ended segments."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.common import SuccessEnvelope, ok
from app.schemas.ipo import IpoCalendarResponse
from app.services.ipo_service import ipo_service

router = APIRouter(prefix="/ipos", tags=["ipos"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=SuccessEnvelope[IpoCalendarResponse])
async def get_ipo_calendar(db: AsyncSession = Depends(get_db)) -> dict:
    """Return the IPO calendar split into ongoing / upcoming / ended."""
    result = await ipo_service.calendar(db)
    return ok(result)
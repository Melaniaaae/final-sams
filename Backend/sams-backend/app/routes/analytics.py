from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services import staff_service
from app.core.dependencies import require_coordinator

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpis")
def get_kpis(
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """
    Coordinator KPI cards — computed live from the database.
    Angular path: GET /api/v1/analytics/kpis
    Returns: { totalStudents, placedPercent, visitedPercent, missingLogsCount, onTrackPercent }
    """
    kpis = staff_service.get_coordinator_kpis(db)
    return {"data": kpis}


@router.get("/urgent-flags")
def get_urgent_flags(
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """
    Students with issues needing coordinator attention.
    Angular path: GET /api/v1/analytics/urgent-flags
    Returns: [{ student: {...}, issue: string }]
    """
    flags = staff_service.get_urgent_flags(db)
    return {"data": flags}

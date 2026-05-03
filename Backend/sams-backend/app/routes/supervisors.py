from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.services import staff_service
from app.core.dependencies import require_coordinator, get_current_user

router = APIRouter(prefix="/supervisors", tags=["Supervisors / Lecturers"])


@router.get("")
def list_supervisors(
    type: Optional[str] = Query(None, description="Filter: 'university' only supported"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all lecturers with their assigned student count.
    Angular path: GET /api/v1/supervisors?type=university
    Used by: Coordinator → Lecturer Management page
    """
    lecturers = staff_service.get_all_lecturers(db)
    return {"data": lecturers}


@router.post("", status_code=201)
def create_supervisor(
    body: dict,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """Coordinator creates a new lecturer account."""
    lecturer = staff_service.create_lecturer(db, body)
    return {"data": lecturer}

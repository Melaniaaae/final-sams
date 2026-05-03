from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.schemas.weekly_log import WeeklyLogCreate, WeeklyLogReview
from app.services import log_service
from app.core.dependencies import get_current_user, require_student, require_staff

router = APIRouter(prefix="/logs", tags=["Weekly Logs"])


@router.get("")
def list_logs(
    studentId: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get weekly logs.
    - Students: automatically scoped to their own logs
    - Staff: use studentId query param to specify which student
    Angular path: GET /api/v1/logs?studentId=SCT/2021/045&page=1&pageSize=20
    """
    if current_user["role"] == "student":
        reg_no = current_user["id"]
    else:
        if not studentId:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="studentId is required for staff")
        reg_no = studentId

    result = log_service.get_logs_by_student(db, reg_no, page, pageSize)
    return {"data": result}


@router.post("", status_code=201)
def submit_log(
    weekNumber: int = Form(...),
    activityDescription: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Student submits a weekly log (with optional file).
    Angular path: POST /api/v1/logs
    """
    log = log_service.create_log(
        db, 
        current_user["id"], 
        week_no=weekNumber, 
        activity_description=activityDescription, 
        file=file
    )
    return {"data": log}


@router.post("/draft")
def save_draft(
    body: dict,
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Save a partial log draft without marking it submitted."""
    log = log_service.save_draft(db, current_user["id"], body)
    return {"data": log}


@router.post("/{log_id}/file")
def upload_log_file(
    log_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Upload a PDF/image file to an existing log entry."""
    log = log_service.attach_log_file(db, log_id, current_user["id"], file)
    return {"data": log}


@router.patch("/{log_id}/review")
def review_log(
    log_id: int,
    data: WeeklyLogReview,
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Lecturer or coordinator reviews a submitted log."""
    log = log_service.review_log(db, log_id, data)
    return {"data": log}

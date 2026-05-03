from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.schemas.student import StudentUpdate
from app.services import student_service
from app.core.dependencies import get_current_user, require_student, require_coordinator

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("")
def list_students(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """
    Coordinator only — paginated, searchable student list.
    Angular uses: GET /api/v1/students?search=jane&status=active&page=1&pageSize=20
    Response shape matches the Angular PaginatedResponse<Student> interface.
    """
    result = student_service.get_all_students(
        db, search=search, status_filter=status, page=page, page_size=pageSize
    )
    return {"data": result}


@router.get("/{reg_no:path}")
def get_student(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a single student record.
    Students can only access their own profile.
    """
    # Students can only read their own data
    if current_user["role"] == "student" and current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    student = student_service.get_student_by_reg(db, reg_no)
    
    try:
        progress = student_service.get_placement_progress(db, reg_no)
        placement = progress.get("placement", {})
    except Exception:
        placement = {}

    from app.models.staff import Staff
    staff = None
    if student.staff_id:
        staff = db.query(Staff).filter(Staff.staff_id == student.staff_id).first()

    return {
        "data": {
            "id": student.reg_no,
            "name": student.name,
            "registrationNumber": student.reg_no,
            "email": student.email,
            "phone": student.phone_number,
            "department": student.department,
            "company": placement.get("companyName"),
            "location": placement.get("location"),
            "startDate": placement.get("startDate"),
            "endDate": placement.get("endDate"),
            "stationSupervisorName": placement.get("stationSupervisorName"),
            "stationSupervisorPhone": placement.get("stationSupervisorPhone"),
            "universitySupervisorId": student.staff_id,
            "universitySupervisorName": staff.name if staff else "Not assigned yet",
            "universitySupervisorPhone": staff.phone_number if staff else "—",
            "yearOfStudy": 3,
            "status": placement.get("status", "pending"),
        }
    }


@router.patch("/{reg_no:path}")
def update_student(
    reg_no: str,
    data: StudentUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update student fields. Students can update their own; coordinators can update any."""
    if current_user["role"] == "student" and current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    updated = student_service.update_student(db, reg_no, data)
    return {"data": {"reg_no": updated.reg_no, "name": updated.name}}


@router.get("/{reg_no:path}/placement-progress")
def get_placement_progress(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns placement progress object used by:
    - Student dashboard (ring, dates, KPI cards)
    - Coordinator student detail view
    Angular path: GET /api/v1/students/{reg_no}/placement-progress
    """
    if current_user["role"] == "student" and current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    progress = student_service.get_placement_progress(db, reg_no)
    return {"data": progress}


@router.get("/{reg_no:path}/notifications")
def get_notifications(
    reg_no: str,
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Returns real-time notifications derived from actual data:
    missing logs, upcoming visits, log reviews.
    Angular path: GET /api/v1/students/{reg_no}/notifications
    """
    if current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    notifications = student_service.get_student_notifications(db, reg_no)
    return {"data": notifications}


@router.patch("/{reg_no:path}/notifications/{notif_id}/read", status_code=204)
def mark_notification_read(
    reg_no: str,
    notif_id: str,
    current_user: dict = Depends(require_student),
):
    """
    Dummy endpoint to satisfy the frontend's mark-as-read request.
    In this MVP, notifications are dynamically derived.
    """
    if current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    return


@router.patch("/{reg_no:path}/assign-supervisor")
def assign_supervisor(
    reg_no: str,
    body: dict,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """Coordinator assigns a university supervisor (lecturer) to a student."""
    from app.services.staff_service import assign_supervisor as svc
    return svc(db, reg_no, body.get("supervisorId", ""))


@router.get("/{reg_no:path}/documents")
def get_documents(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all uploaded documents for a student.
    Students can access their own; staff can access any.
    """
    if current_user["role"] == "student" and current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    
    docs = student_service.get_student_documents(db, reg_no)
    return {"data": docs}

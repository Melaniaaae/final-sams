# app/routes/students.py
# KEY FIX: All sub-routes with fixed suffixes (/assign-supervisor, /placement-progress etc.)
# MUST be defined BEFORE the /{reg_no:path} catch-all routes.
# Previously /{reg_no:path}/assign-supervisor was capturing the suffix as part of reg_no.

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.connection import get_db
from app.schemas.student import StudentUpdate
from app.services import student_service
from app.core.dependencies import get_current_user, require_student, require_coordinator

router = APIRouter(prefix="/students", tags=["Students"])


# ═══════════════════════════════════════════════════════════════════════════════
# COLLECTION ROUTES (no path params)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("")
def list_students(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    supervisorId: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    result = student_service.get_all_students(
        db, search=search, status_filter=status,
        supervisor_id=supervisorId, page=page, page_size=pageSize
    )
    return {"data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# SUB-ROUTES — MUST come before /{reg_no:path} or FastAPI will never reach them
# ═══════════════════════════════════════════════════════════════════════════════

@router.patch("/{reg_no}/assign-supervisor")
def assign_supervisor(
    reg_no: str,
    body: dict,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """
    Coordinator assigns a university supervisor (lecturer) to a student.
    reg_no is URL-decoded automatically by FastAPI.
    Angular sends: PATCH /api/v1/students/CS%2F001%2F2022/assign-supervisor
    """
    # URL-decode slashes that Angular encodes (e.g. CS%2F001%2F2022 → CS/001/2022)
    from urllib.parse import unquote
    decoded_reg = unquote(reg_no)

    supervisor_id = body.get("supervisorId", "")
    if not supervisor_id:
        raise HTTPException(status_code=422, detail="supervisorId is required")

    from app.services.staff_service import assign_supervisor as svc
    return svc(db, decoded_reg, supervisor_id)


@router.get("/{reg_no}/placement-progress")
def get_placement_progress(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from urllib.parse import unquote
    decoded_reg = unquote(reg_no)

    if current_user["role"] == "student" and current_user["id"] != decoded_reg:
        raise HTTPException(status_code=403, detail="Access denied")

    progress = student_service.get_placement_progress(db, decoded_reg)
    return {"data": progress}


@router.get("/{reg_no}/notifications")
def get_notifications(
    reg_no: str,
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db),
):
    from urllib.parse import unquote
    decoded_reg = unquote(reg_no)

    if current_user["id"] != decoded_reg:
        raise HTTPException(status_code=403, detail="Access denied")

    notifications = student_service.get_student_notifications(db, decoded_reg)
    return {"data": notifications}


@router.patch("/{reg_no}/notifications/{notif_id}/read", status_code=204)
def mark_notification_read(
    reg_no: str,
    notif_id: str,
    current_user: dict = Depends(require_student),
):
    from urllib.parse import unquote
    decoded_reg = unquote(reg_no)

    if current_user["id"] != decoded_reg:
        raise HTTPException(status_code=403, detail="Access denied")
    return


@router.get("/{reg_no}/documents")
def get_documents(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from urllib.parse import unquote
    decoded_reg = unquote(reg_no)

    if current_user["role"] == "student" and current_user["id"] != decoded_reg:
        raise HTTPException(status_code=403, detail="Access denied")

    docs = student_service.get_student_documents(db, decoded_reg)
    return {"data": docs}


# ═══════════════════════════════════════════════════════════════════════════════
# SINGLE STUDENT ROUTES — /{reg_no:path} catch-all MUST be LAST
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{reg_no:path}")
def get_student(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from urllib.parse import unquote
    decoded_reg = unquote(reg_no)

    if current_user["role"] == "student" and current_user["id"] != decoded_reg:
        raise HTTPException(status_code=403, detail="Access denied")

    student = student_service.get_student_by_reg(db, decoded_reg)

    try:
        progress = student_service.get_placement_progress(db, decoded_reg)
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
    from urllib.parse import unquote
    decoded_reg = unquote(reg_no)

    if current_user["role"] == "student" and current_user["id"] != decoded_reg:
        raise HTTPException(status_code=403, detail="Access denied")

    updated = student_service.update_student(db, decoded_reg, data)
    return {"data": {"reg_no": updated.reg_no, "name": updated.name}}
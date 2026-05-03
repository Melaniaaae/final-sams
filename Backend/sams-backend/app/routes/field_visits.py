from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import date

from app.database.connection import get_db
from app.models.field_visit import FieldVisit
from app.schemas.field_visit import FieldVisitCreate, FieldVisitOut
from app.services.report_service import upload_visit_form
from app.core.dependencies import get_current_user, require_staff, require_coordinator

router = APIRouter(prefix="/field-visits", tags=["Field Visits"])


@router.get("/{reg_no}")
def get_visits_for_student(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all field visits for a student.
    Students see their own; staff see any.
    """
    if current_user["role"] == "student" and current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    visits = (
        db.query(FieldVisit)
        .filter(FieldVisit.reg_no == reg_no)
        .order_by(FieldVisit.visit_date.desc())
        .all()
    )
    return {
        "data": [
            {
                "visitId": v.visit_id,
                "placementId": v.placement_id,
                "regNo": v.reg_no,
                "staffId": v.staff_id,
                "visitDate": str(v.visit_date),
                "comments": v.comments,
                "visitFormUpload": v.visit_form_upload,
            }
            for v in visits
        ]
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_field_visit(
    data: FieldVisitCreate,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """Coordinator schedules a field visit."""
    visit = FieldVisit(
        placement_id=data.placement_id,
        reg_no=data.reg_no,
        staff_id=data.staff_id,
        visit_date=data.visit_date,
        comments=data.comments,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return {"data": {"visitId": visit.visit_id, "visitDate": str(visit.visit_date)}}


@router.post("/{visit_id}/upload")
def upload_visit_form_file(
    visit_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Lecturer uploads the signed field visit form PDF."""
    visit = upload_visit_form(db, visit_id, file)
    return {"data": {"visitId": visit.visit_id, "fileUrl": visit.visit_form_upload}}

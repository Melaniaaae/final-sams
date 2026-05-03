from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.final_report import FinalReportGrade
from app.services import report_service
from app.core.dependencies import get_current_user, require_student, require_coordinator

router = APIRouter(prefix="/reports", tags=["Final Reports"])


@router.get("/{reg_no}")
def get_report(
    reg_no: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a student's final report record.
    Angular path: GET /api/v1/reports/{reg_no}
    """
    if current_user["role"] == "student" and current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    report = report_service.get_report_by_student(db, reg_no)
    return {
        "data": {
            "reportId": report.report_id,
            "regNo": report.reg_no,
            "submissionDate": str(report.submission_date) if report.submission_date else None,
            "fileUrl": report.report_file_upload,
            "completionStatus": report.completion_status.value,
        }
    }


@router.post("/{reg_no}/upload")
def upload_report(
    reg_no: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_student),
    db: Session = Depends(get_db),
):
    """
    Student uploads their final attachment report PDF.
    Angular path: POST /api/v1/reports/{reg_no}/upload
    """
    if current_user["id"] != reg_no:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    report = report_service.upload_final_report(db, reg_no, file)
    return {"data": {"completionStatus": report.completion_status.value}}


@router.patch("/{reg_no}/grade")
def grade_report(
    reg_no: str,
    data: FinalReportGrade,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """
    Coordinator grades/approves a final report.
    Angular path: PATCH /api/v1/reports/{reg_no}/grade
    """
    report = report_service.grade_report(db, reg_no, data)
    return {"data": {"completionStatus": report.completion_status.value}}

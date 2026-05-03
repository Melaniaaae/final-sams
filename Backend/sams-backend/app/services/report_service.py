from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from datetime import date
from pathlib import Path
import uuid

from app.models.final_report import FinalReport, CompletionStatus
from app.models.field_visit import FieldVisit
from app.schemas.final_report import FinalReportGrade
from app.core.config import settings


def get_report_by_student(db: Session, reg_no: str) -> FinalReport:
    report = db.query(FinalReport).filter(FinalReport.reg_no == reg_no).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report record not found")
    return report


def upload_final_report(
    db: Session, reg_no: str, file: UploadFile
) -> FinalReport:
    report = db.query(FinalReport).filter(FinalReport.reg_no == reg_no).first()
    if not report:
        report = FinalReport(reg_no=reg_no)
        db.add(report)

    ext = Path(file.filename).suffix.lower()
    if ext not in (".pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    filename = f"{uuid.uuid4().hex}{ext}"
    upload_path = Path(settings.UPLOAD_DIR) / "reports" / filename
    upload_path.parent.mkdir(parents=True, exist_ok=True)

    content = file.file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB} MB",
        )

    with open(upload_path, "wb") as f:
        f.write(content)

    report.report_file_upload = str(upload_path)
    report.submission_date = date.today()
    report.completion_status = CompletionStatus.submitted
    db.commit()
    db.refresh(report)
    return report


def grade_report(db: Session, reg_no: str, data: FinalReportGrade) -> FinalReport:
    report = get_report_by_student(db, reg_no)
    try:
        report.completion_status = CompletionStatus(data.completion_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid completion status")
    db.commit()
    db.refresh(report)
    return report


def get_field_visit(db: Session, reg_no: str):
    return (
        db.query(FieldVisit)
        .filter(FieldVisit.reg_no == reg_no)
        .order_by(FieldVisit.visit_date.desc())
        .first()
    )


def upload_visit_form(
    db: Session, visit_id: int, file: UploadFile
) -> FieldVisit:
    visit = db.query(FieldVisit).filter(FieldVisit.visit_id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Field visit not found")

    ext = Path(file.filename).suffix.lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_path = Path(settings.UPLOAD_DIR) / "visit_forms" / filename
    upload_path.parent.mkdir(parents=True, exist_ok=True)

    with open(upload_path, "wb") as f:
        f.write(file.file.read())

    visit.visit_form_upload = str(upload_path)
    db.commit()
    db.refresh(visit)
    return visit

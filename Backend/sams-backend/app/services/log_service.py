from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from datetime import date
from pathlib import Path
import uuid

from app.models.weekly_log import WeeklyLog, LogStatus
from app.models.placement import Placement
from app.schemas.weekly_log import WeeklyLogCreate, WeeklyLogUpdate, WeeklyLogReview
from app.core.config import settings


from datetime import timedelta

def _generate_missing_logs(db: Session, placement: Placement):
    days_total = max((placement.end_date - placement.start_date).days, 1)
    total_weeks = (days_total + 6) // 7
    
    existing_logs = db.query(WeeklyLog).filter(WeeklyLog.placement_id == placement.placement_id).all()
    existing_weeks = {log.week_no for log in existing_logs}
    
    new_logs = []
    for w in range(1, total_weeks + 1):
        if w not in existing_weeks:
            log = WeeklyLog(
                placement_id=placement.placement_id,
                company_id=placement.company_id,
                week_no=w,
                activity_description="",
                submission_date=placement.start_date + timedelta(days=(w-1)*7), # start of week as submission_date for now
                station_supervisor_name="",
                station_supervisor_phone="",
                status=LogStatus.missing
            )
            db.add(log)
            new_logs.append(log)
    if new_logs:
        db.commit()

def get_logs_by_student(
    db: Session,
    reg_no: str,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Returns all weekly logs for a student, derived via their placement."""
    placement = (
        db.query(Placement)
        .filter(Placement.reg_no == reg_no)
        .order_by(Placement.created_at.desc())
        .first()
    )
    if not placement:
        return {"items": [], "total": 0, "page": page, "pageSize": page_size}

    _generate_missing_logs(db, placement)

    query = (
        db.query(WeeklyLog)
        .filter(WeeklyLog.placement_id == placement.placement_id)
        .order_by(WeeklyLog.week_no.desc())
    )
    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [_log_to_dict(log, placement) for log in logs],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


def create_log(db: Session, reg_no: str, data: WeeklyLogCreate) -> dict:
    """Submit a new weekly log for the authenticated student."""
    # Verify placement belongs to this student
    placement = db.query(Placement).filter(
        Placement.placement_id == data.placement_id,
        Placement.reg_no == reg_no,
    ).first()
    if not placement:
        raise HTTPException(status_code=403, detail="Placement not found or unauthorized")

    # Check existing log
    existing = db.query(WeeklyLog).filter(
        WeeklyLog.placement_id == data.placement_id,
        WeeklyLog.week_no == data.week_no,
    ).first()
    
    if existing:
        if existing.status != LogStatus.missing:
            raise HTTPException(
                status_code=409,
                detail=f"Log for week {data.week_no} already exists and is {existing.status.value}",
            )
        # Update the pre-generated missing log
        existing.activity_description = data.activity_description
        existing.submission_date = data.submission_date
        existing.station_supervisor_name = data.station_supervisor_name
        existing.station_supervisor_phone = data.station_supervisor_phone
        existing.status = LogStatus.submitted
        log = existing
    else:
        log = WeeklyLog(
            placement_id=data.placement_id,
            company_id=placement.company_id,
            week_no=data.week_no,
            activity_description=data.activity_description,
            submission_date=data.submission_date,
            station_supervisor_name=data.station_supervisor_name,
            station_supervisor_phone=data.station_supervisor_phone,
            status=LogStatus.submitted,
        )
        db.add(log)
        
    db.commit()
    db.refresh(log)
    return _log_to_dict(log, placement)


def attach_log_file(
    db: Session, log_id: int, reg_no: str, file: UploadFile
) -> dict:
    """Upload a PDF/image file and attach it to an existing log."""
    log = _get_log_or_404(db, log_id)

    # Confirm the log belongs to this student
    placement = db.query(Placement).filter(
        Placement.placement_id == log.placement_id,
        Placement.reg_no == reg_no,
    ).first()
    if not placement:
        raise HTTPException(status_code=403, detail="Unauthorized")

    file_path = _save_upload(file, "logbooks")
    log.logbook_file_upload = file_path
    db.commit()
    db.refresh(log)
    return _log_to_dict(log)


def review_log(db: Session, log_id: int, data: WeeklyLogReview) -> dict:
    """Coordinator/lecturer marks a log as reviewed or missing."""
    log = _get_log_or_404(db, log_id)
    try:
        log.status = LogStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")
    log.reviewer_comment = data.reviewer_comment
    db.commit()
    db.refresh(log)
    return _log_to_dict(log)


def save_draft(db: Session, reg_no: str, data: dict) -> dict:
    """Save a partial log as a draft (status pending)."""
    placement = (
        db.query(Placement)
        .filter(Placement.reg_no == reg_no)
        .order_by(Placement.created_at.desc())
        .first()
    )
    if not placement:
        raise HTTPException(status_code=404, detail="No placement found")

    log = WeeklyLog(
        placement_id=placement.placement_id,
        company_id=placement.company_id,
        week_no=data.get("weekNumber", 0),
        activity_description=data.get("activityDescription", ""),
        submission_date=date.today(),
        station_supervisor_name="",
        station_supervisor_phone="",
        status=LogStatus.missing,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _log_to_dict(log)


# ── Helpers ───────────────────────────────────────────────────────────────

def _get_log_or_404(db: Session, log_id: int) -> WeeklyLog:
    log = db.query(WeeklyLog).filter(WeeklyLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log


def _save_upload(file: UploadFile, sub_dir: str) -> str:
    """Save an uploaded file and return its relative path."""
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_path = Path(settings.UPLOAD_DIR) / sub_dir / filename
    upload_path.parent.mkdir(parents=True, exist_ok=True)

    with open(upload_path, "wb") as f:
        content = file.file.read()
        if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB} MB",
            )
        f.write(content)

    return f"/uploads/{sub_dir}/{filename}"


def _log_to_dict(log: WeeklyLog, placement: Placement = None) -> dict:
    week_start = str(log.submission_date)
    week_end = str(log.submission_date)
    student_id = ""

    if placement:
        student_id = placement.reg_no
        from datetime import timedelta
        # compute actual start/end based on placement start and log.week_no
        start = placement.start_date + timedelta(days=(log.week_no - 1) * 7)
        end = start + timedelta(days=6)
        week_start = str(start)
        week_end = str(end)

    return {
        "id": str(log.log_id),
        "studentId": student_id,
        "placementId": str(log.placement_id),
        "weekNumber": log.week_no,
        "weekStart": week_start,
        "weekEnd": week_end,
        "activityDescription": log.activity_description,
        "fileUrl": log.logbook_file_upload,
        "status": log.status.value,
        "submittedAt": log.created_at.isoformat() if log.created_at else None,
        "reviewerComment": log.reviewer_comment,
    }

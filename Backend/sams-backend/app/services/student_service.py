from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from datetime import date, datetime
from typing import Optional

from app.models.student import Student
from app.models.placement import Placement
from app.models.weekly_log import WeeklyLog, LogStatus
from app.models.company import Company
from app.schemas.student import StudentUpdate, PlacementProgressOut, NotificationOut


def get_student_by_reg(db: Session, reg_no: str) -> Student:
    student = db.query(Student).filter(Student.reg_no == reg_no).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def update_student(db: Session, reg_no: str, data: StudentUpdate) -> Student:
    student = get_student_by_reg(db, reg_no)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


def get_all_students(
    db: Session,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = db.query(Student)

    if search:
        like = f"%{search}%"
        query = query.filter(
            Student.name.ilike(like) | Student.reg_no.ilike(like)
        )

    # Status filter uses placement presence
    if status_filter == "active":
        query = query.join(Placement).filter(Placement.end_date >= date.today())
    elif status_filter == "completed":
        query = query.join(Placement).filter(Placement.end_date < date.today())
    elif status_filter == "pending":
        query = query.outerjoin(Placement).filter(Placement.placement_id == None)  # noqa

    total = query.count()
    students = query.offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for s in students:
        placement = (
            db.query(Placement)
            .filter(Placement.reg_no == s.reg_no)
            .order_by(Placement.created_at.desc())
            .first()
        )
        from app.models.staff import Staff
        staff = None
        if s.staff_id:
            staff = db.query(Staff).filter(Staff.staff_id == s.staff_id).first()
        attachment_status = _derive_status(placement)
        items.append({
            "id": s.reg_no,
            "name": s.name,
            "registrationNumber": s.reg_no,
            "email": s.email,
            "phone": s.phone_number,
            "school": s.department,
            "yearOfStudy": 3,  # can be added to Student model later
            "status": attachment_status,
            "placementId": placement.placement_id if placement else None,
            "universitySupervisorName": staff.name if staff else "Not assigned",
            "company": placement.company.company_name if placement and placement.company else "Unassigned",
        })

    return {"items": items, "total": total, "page": page, "pageSize": page_size}


def get_placement_progress(db: Session, reg_no: str) -> dict:
    placement = (
        db.query(Placement)
        .options(joinedload(Placement.company))
        .filter(Placement.reg_no == reg_no)
        .order_by(Placement.created_at.desc())
        .first()
    )
    if not placement:
        return {
            "placement": {
                "id": "",
                "studentId": reg_no,
                "companyId": "",
                "companyName": "Unassigned",
                "department": "",
                "location": "N/A",
                "startDate": str(date.today()),
                "endDate": str(date.today()),
                "status": "pending",
                "stationSupervisorName": "N/A",
                "stationSupervisorPhone": "N/A",
            },
            "daysTotal": 0,
            "daysElapsed": 0,
            "daysRemaining": 0,
            "completionPercent": 0,
        }

    today = date.today()
    start = placement.start_date
    end = placement.end_date

    days_total = max((end - start).days, 1)
    days_elapsed = max(min((today - start).days, days_total), 0)
    days_remaining = days_total - days_elapsed
    completion_percent = min(round((days_elapsed / days_total) * 100), 100)

    return {
        "placement": {
            "id": placement.placement_id,
            "studentId": placement.reg_no,
            "companyId": placement.company_id,
            "companyName": placement.company.company_name,
            "department": "Software Engineering",  # extend model if needed
            "location": f"{placement.company.town_city}, {placement.company.county}",
            "startDate": str(placement.start_date),
            "endDate": str(placement.end_date),
            "status": _derive_status(placement),
            "stationSupervisorName": placement.company.contact_person_name,
            "stationSupervisorPhone": placement.company.contact_person_phone,
        },
        "daysTotal": days_total,
        "daysElapsed": days_elapsed,
        "daysRemaining": days_remaining,
        "completionPercent": completion_percent,
    }


def get_student_notifications(db: Session, reg_no: str) -> list:
    """
    Derives notifications from real data:
    - Missing weekly logs
    - Upcoming field visits
    - Log reviews
    """
    notifications = []
    today = date.today()

    # Find the placement
    placement = (
        db.query(Placement)
        .filter(Placement.reg_no == reg_no)
        .order_by(Placement.created_at.desc())
        .first()
    )
    if not placement:
        return []

    # Check for missing logs this week
    start = placement.start_date
    current_week = max((today - start).days // 7 + 1, 1)
    submitted_weeks = {
        log.week_no
        for log in db.query(WeeklyLog)
        .filter(WeeklyLog.placement_id == placement.placement_id)
        .all()
    }
    missing_weeks = [w for w in range(1, current_week) if w not in submitted_weeks]

    if missing_weeks:
        notifications.append({
            "id": "notif-missing-logs",
            "type": "danger",
            "message": f"Week {missing_weeks[-1]} log is overdue — please submit it",
            "createdAt": datetime.utcnow().isoformat(),
            "read": False,
        })

    # Upcoming field visit (any within next 7 days)
    from app.models.field_visit import FieldVisit
    upcoming = (
        db.query(FieldVisit)
        .filter(
            FieldVisit.reg_no == reg_no,
            FieldVisit.visit_date >= today,
        )
        .order_by(FieldVisit.visit_date)
        .first()
    )
    if upcoming:
        notifications.append({
            "id": f"notif-visit-{upcoming.visit_id}",
            "type": "warning",
            "message": f"Upcoming field visit scheduled for {upcoming.visit_date}",
            "createdAt": datetime.utcnow().isoformat(),
            "read": False,
        })

    # Reviewed logs
    reviewed = (
        db.query(WeeklyLog)
        .filter(
            WeeklyLog.placement_id == placement.placement_id,
            WeeklyLog.status == LogStatus.reviewed,
        )
        .order_by(WeeklyLog.created_at.desc())
        .first()
    )
    if reviewed:
        notifications.append({
            "id": f"notif-reviewed-{reviewed.log_id}",
            "type": "info",
            "message": f"Your Week {reviewed.week_no} log was reviewed",
            "createdAt": reviewed.updated_at.isoformat(),
            "read": True,
        })

    return notifications


# ── Helpers ───────────────────────────────────────────────────────────────

def _derive_status(placement: Optional[Placement]) -> str:
    if placement is None:
        return "pending"
    today = date.today()
    if placement.end_date < today:
        return "completed"
    if placement.start_date <= today <= placement.end_date:
        return "active"
    return "pending"


def get_student_documents(db: Session, reg_no: str) -> list:
    placement = (
        db.query(Placement)
        .filter(Placement.reg_no == reg_no)
        .order_by(Placement.created_at.desc())
        .first()
    )
    if not placement:
        return []

    logs = (
        db.query(WeeklyLog)
        .filter(
            WeeklyLog.placement_id == placement.placement_id,
            WeeklyLog.logbook_file_upload.isnot(None)
        )
        .all()
    )

    documents = []
    for log in logs:
        documents.append({
            "id": f"log-{log.log_id}",
            "name": f"Week {log.week_no} Logbook",
            "type": "logbook",
            "url": log.logbook_file_upload,
            "uploadedAt": log.updated_at.isoformat() if hasattr(log, 'updated_at') and log.updated_at else (log.created_at.isoformat() if hasattr(log, 'created_at') and log.created_at else None)
        })

    return documents

from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from typing import Optional

from app.models.staff import Staff, StaffRole
from app.models.student import Student
from app.models.placement import Placement
from app.models.weekly_log import WeeklyLog, LogStatus
from app.models.field_visit import FieldVisit
from app.schemas.staff import StaffUpdate


MAX_STUDENTS_PER_LECTURER = 15


def get_all_lecturers(db: Session) -> list:
    """Returns all staff members with role = lecturer, with assigned student count."""
    lecturers = db.query(Staff).filter(Staff.role == StaffRole.lecturer).all()
    result = []
    for lec in lecturers:
        count = db.query(Student).filter(Student.staff_id == lec.staff_id).count()
        result.append({
            "id": lec.staff_id,
            "name": lec.name,
            "email": lec.email,
            "phone": lec.phone_number,
            "type": "university",
            "maxStudents": MAX_STUDENTS_PER_LECTURER,
            "assignedStudents": count,
        })
    return result


def create_lecturer(db: Session, data: dict) -> dict:
    from app.core.security import hash_password

    if db.query(Staff).filter(Staff.staff_id == data["staff_id"]).first():
        raise HTTPException(status_code=409, detail="Staff ID already exists")
    if db.query(Staff).filter(Staff.email == data["email"]).first():
        raise HTTPException(status_code=409, detail="Email already exists")

    lecturer = Staff(
        staff_id=data["staff_id"],
        name=data["name"],
        email=data["email"],
        department=data.get("department", "General"),
        phone_number=data["phone"],
        role=StaffRole.lecturer,
        hashed_password=hash_password(data.get("password", "Sams@2025")),
    )
    db.add(lecturer)
    db.commit()
    db.refresh(lecturer)

    return {
        "id": lecturer.staff_id,
        "name": lecturer.name,
        "email": lecturer.email,
        "phone": lecturer.phone_number,
        "type": "university",
        "maxStudents": MAX_STUDENTS_PER_LECTURER,
        "assignedStudents": 0,
    }


def assign_supervisor(db: Session, reg_no: str, staff_id: str) -> dict:
    student = db.query(Student).filter(Student.reg_no == reg_no).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    lecturer = db.query(Staff).filter(
        Staff.staff_id == staff_id,
        Staff.role == StaffRole.lecturer,
    ).first()
    if not lecturer:
        raise HTTPException(status_code=404, detail="Lecturer not found")

    # Check capacity
    count = db.query(Student).filter(Student.staff_id == staff_id).count()
    if count >= MAX_STUDENTS_PER_LECTURER:
        raise HTTPException(status_code=400, detail="Lecturer has reached maximum student capacity")

    student.staff_id = staff_id
    db.commit()
    return {"message": f"Supervisor {staff_id} assigned to student {reg_no}"}


def get_coordinator_kpis(db: Session) -> dict:
    """Compute KPI metrics for the coordinator dashboard."""
    total = db.query(Student).count()
    if total == 0:
        return {
            "totalStudents": 0,
            "placedPercent": 0.0,
            "visitedPercent": 0.0,
            "missingLogsCount": 0,
            "onTrackPercent": 0.0,
        }

    today = date.today()

    # Students with an active placement
    placed = (
        db.query(Student)
        .join(Placement)
        .filter(Placement.start_date <= today, Placement.end_date >= today)
        .distinct()
        .count()
    )

    # Students who had at least one field visit
    visited = (
        db.query(Student)
        .join(FieldVisit, FieldVisit.reg_no == Student.reg_no)
        .distinct()
        .count()
    )

    # Students missing at least one expected weekly log
    missing_logs_count = _count_students_missing_logs(db, today)

    # Students on track = placed and no missing logs
    on_track = placed - missing_logs_count if placed > missing_logs_count else 0

    # Geographic distribution
    from sqlalchemy import func
    from app.models.company import Company
    geo_data = (
        db.query(Company.county, func.count(Placement.placement_id))
        .join(Placement)
        .group_by(Company.county)
        .all()
    )
    geo_distribution = [{"county": row[0], "count": row[1]} for row in geo_data]

    return {
        "totalStudents": total,
        "placedPercent": round((placed / total) * 100, 1),
        "visitedPercent": round((visited / total) * 100, 1),
        "missingLogsCount": missing_logs_count,
        "onTrackPercent": round((on_track / total) * 100, 1),
        "geographicDistribution": geo_distribution,
    }


def get_urgent_flags(db: Session) -> list:
    """Returns students with issues that need coordinator attention."""
    flags = []
    today = date.today()

    # Students with active placement but missing logs
    placements = (
        db.query(Placement)
        .filter(Placement.start_date <= today, Placement.end_date >= today)
        .all()
    )

    for placement in placements:
        current_week = max((today - placement.start_date).days // 7, 0)
        if current_week == 0:
            continue

        submitted = {
            log.week_no
            for log in db.query(WeeklyLog)
            .filter(WeeklyLog.placement_id == placement.placement_id)
            .all()
        }
        missing_count = len(
            [w for w in range(1, current_week + 1) if w not in submitted]
        )

        if missing_count > 0:
            s = db.query(Student).filter(Student.reg_no == placement.reg_no).first()
            if s:
                flags.append({
                    "student": {
                        "id": s.reg_no,
                        "name": s.name,
                        "registrationNumber": s.reg_no,
                        "status": "active",
                    },
                    "issue": f"{missing_count} log{'s' if missing_count > 1 else ''} missing",
                })

    # Students with no supervisor assigned
    unassigned = (
        db.query(Student)
        .filter(Student.staff_id == None)  # noqa
        .join(Placement)
        .all()
    )
    for s in unassigned:
        # Avoid duplicating if already flagged for missing logs
        if not any(f["student"]["id"] == s.reg_no for f in flags):
            flags.append({
                "student": {
                    "id": s.reg_no,
                    "name": s.name,
                    "registrationNumber": s.reg_no,
                    "status": "pending",
                },
                "issue": "No supervisor assigned",
            })

    return flags[:10]  # return top 10


# ── Helpers ───────────────────────────────────────────────────────────────

def _count_students_missing_logs(db: Session, today: date) -> int:
    count = 0
    active_placements = (
        db.query(Placement)
        .filter(Placement.start_date <= today, Placement.end_date >= today)
        .all()
    )
    for placement in active_placements:
        current_week = max((today - placement.start_date).days // 7, 0)
        if current_week == 0:
            continue
        submitted_weeks = db.query(WeeklyLog.week_no).filter(
            WeeklyLog.placement_id == placement.placement_id
        ).count()
        if submitted_weeks < current_week:
            count += 1
    return count

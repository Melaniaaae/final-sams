
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.student import Student
from app.models.staff import Staff
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import (
    StudentRegisterSchema,
    StaffRegisterSchema,
    TokenResponse,
    LoginSchema,
)

from app.models.company import Company
from app.models.placement import Placement
from datetime import datetime

# ── Student registration ───────────────────────────────────────────────────────

def register_student(db: Session, data: StudentRegisterSchema) -> Student:
    if db.query(Student).filter(Student.reg_no == data.registrationNumber).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration number '{data.registrationNumber}' is already registered.",
        )
    if db.query(Student).filter(Student.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{data.email}' is already in use.",
        )

    # 1. Create Student
    student = Student(
        reg_no=data.registrationNumber,
        name=data.name,
        email=data.email,
        phone_number=data.phone,
        department="Software Engineering", # Mock data as requested
        hashed_password=hash_password(data.password),
        staff_id=None,
    )
    db.add(student)
    
    # 2. Check or Create Company
    company_name = data.company.strip()
    company = db.query(Company).filter(Company.company_name == company_name).first()
    if not company:
        company = Company(
            company_name=company_name,
            industry="Unknown",
            town_city=data.location.get("city", "Unknown"),
            county=data.location.get("county", "Unknown"),
            contact_person_name=data.stationSupervisor,
            contact_person_phone=data.stationSupervisorPhone
        )
        db.add(company)
        db.flush() # flush to get company_id
    else:
        if data.stationSupervisor:
            company.contact_person_name = data.stationSupervisor
        if data.stationSupervisorPhone:
            company.contact_person_phone = data.stationSupervisorPhone
        db.add(company)
        db.flush()

    # 3. Create Placement
    start_date = datetime.strptime(data.startDate, "%Y-%m-%d").date()
    end_date = datetime.strptime(data.endDate, "%Y-%m-%d").date()
    
    placement = Placement(
        company_id=company.company_id,
        reg_no=student.reg_no,
        start_date=start_date,
        end_date=end_date,
        # If we had station_supervisor on placement we would add it here
    )
    db.add(placement)
    
    db.commit()
    db.refresh(student)
    return student

# ── Staff registration ────────────────────────────────────────────────────────

def register_staff(db: Session, data: StaffRegisterSchema) -> Staff:
    if db.query(Staff).filter(Staff.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{data.email}' is already in use.",
        )

    staff = Staff(
        name=data.name,
        email=data.email,
        department=data.department,
        phone_number=data.phone_number,
        role=data.role,
        hashed_password=hash_password(data.password),
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


# ── Login ─────────────────────────────────────────────────────────────────────

def login_user(db: Session, data: LoginSchema) -> dict:
    """
    Authenticates either a Student or Staff member.
    Searches both tables to be forgiving of frontend role selections.
    """
    from app.core.security import verify_password, create_access_token

    email = data.email.strip().lower()

    # ── Try student ───────────────────────────────────────────────────────
    student = db.query(Student).filter(Student.email == email).first()
    if student:
        if not verify_password(data.password, student.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        token = create_access_token({
            "sub":  student.email,
            "role": "student",
            "id":   student.reg_no,
        })
        return {
            "access_token": token,
            "token_type":   "bearer",
            "user": {
                "id":                 student.reg_no,
                "name":               student.name,
                "email":              student.email,
                "role":               "student",
                "registrationNumber": student.reg_no,
            },
        }

    # ── Try staff (coordinator / lecturer) ────────────────────────────────
    staff = db.query(Staff).filter(Staff.email == email).first()
    if staff:
        if not verify_password(data.password, staff.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        token = create_access_token({
            "sub":  staff.email,
            "role": staff.role.value,
            "id":   staff.staff_id,
        })
        return {
            "access_token": token,
            "token_type":   "bearer",
            "user": {
                "id":                 staff.staff_id,
                "name":               staff.name,
                "email":              staff.email,
                "role":               staff.role.value,
                "registrationNumber": None,
            },
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
    )
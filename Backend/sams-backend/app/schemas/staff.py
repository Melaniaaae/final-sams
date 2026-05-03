from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class StaffOut(BaseModel):
    staff_id: str
    name: str
    email: EmailStr
    department: str
    phone_number: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None


class StaffWithStudentCount(StaffOut):
    assigned_student_count: int
    max_students: int = 15


class CoordinatorKPIs(BaseModel):
    total_students: int
    placed_percent: float
    visited_percent: float
    missing_logs_count: int
    on_track_percent: float


class UrgentFlag(BaseModel):
    student: dict
    issue: str

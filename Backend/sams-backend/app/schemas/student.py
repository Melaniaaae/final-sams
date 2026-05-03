from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class StudentOut(BaseModel):
    reg_no: str
    name: str
    email: EmailStr
    phone_number: str
    department: str
    staff_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    department: Optional[str] = None
    staff_id: Optional[str] = None


class PlacementProgressOut(BaseModel):
    placement: dict
    days_total: int
    days_elapsed: int
    days_remaining: int
    completion_percent: int


class NotificationOut(BaseModel):
    id: str
    type: str       # "danger" | "warning" | "info"
    message: str
    created_at: str
    read: bool

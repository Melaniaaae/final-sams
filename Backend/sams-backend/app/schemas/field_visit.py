from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class FieldVisitCreate(BaseModel):
    placement_id: int
    reg_no: str
    staff_id: str
    visit_date: date
    comments: Optional[str] = None


class FieldVisitOut(BaseModel):
    visit_id: int
    placement_id: int
    reg_no: str
    staff_id: str
    visit_date: date
    comments: Optional[str] = None
    visit_form_upload: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FieldVisitUpdate(BaseModel):
    visit_date: Optional[date] = None
    comments: Optional[str] = None

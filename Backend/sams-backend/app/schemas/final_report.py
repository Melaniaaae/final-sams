from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class FinalReportCreate(BaseModel):
    reg_no: str


class FinalReportOut(BaseModel):
    report_id: int
    reg_no: str
    submission_date: Optional[date] = None
    report_file_upload: Optional[str] = None
    completion_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FinalReportGrade(BaseModel):
    completion_status: str   # "graded" | "completed"

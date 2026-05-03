from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class WeeklyLogCreate(BaseModel):
    placement_id: int
    week_no: int
    activity_description: str
    submission_date: date
    station_supervisor_name: str
    station_supervisor_phone: str


class WeeklyLogOut(BaseModel):
    log_id: int
    placement_id: int
    company_id: int
    week_no: int
    activity_description: str
    logbook_file_upload: Optional[str] = None
    submission_date: date
    station_supervisor_name: str
    station_supervisor_phone: str
    status: str
    reviewer_comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class WeeklyLogUpdate(BaseModel):
    activity_description: Optional[str] = None
    station_supervisor_name: Optional[str] = None
    station_supervisor_phone: Optional[str] = None


class WeeklyLogReview(BaseModel):
    status: str          # "reviewed" | "missing"
    reviewer_comment: Optional[str] = None


class PaginatedLogsOut(BaseModel):
    items: list[WeeklyLogOut]
    total: int
    page: int
    page_size: int

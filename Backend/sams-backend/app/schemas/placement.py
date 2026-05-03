from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class PlacementCreate(BaseModel):
    company_id: int
    reg_no: str
    start_date: date
    end_date: date


class PlacementOut(BaseModel):
    placement_id: int
    company_id: int
    reg_no: str
    start_date: date
    end_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class PlacementWithCompanyOut(PlacementOut):
    company_name: str
    town_city: str
    county: str


class PlacementUpdate(BaseModel):
    company_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

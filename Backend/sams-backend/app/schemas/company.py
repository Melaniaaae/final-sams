from pydantic import BaseModel
from typing import Optional


class CompanyCreate(BaseModel):
    company_name: str
    industry: str
    location_lat: Optional[float] = None
    location_long: Optional[float] = None
    town_city: str
    county: str
    contact_person_name: str
    contact_person_phone: str


class CompanyOut(BaseModel):
    company_id: int
    company_name: str
    industry: str
    location_lat: Optional[float] = None
    location_long: Optional[float] = None
    town_city: str
    county: str
    contact_person_name: str
    contact_person_phone: str

    model_config = {"from_attributes": True}


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    location_lat: Optional[float] = None
    location_long: Optional[float] = None
    town_city: Optional[str] = None
    county: Optional[str] = None
    contact_person_name: Optional[str] = None
    contact_person_phone: Optional[str] = None

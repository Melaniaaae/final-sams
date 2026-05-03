from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.company import Company
from app.models.placement import Placement
from app.schemas.company import CompanyCreate, CompanyUpdate


def get_all_companies(db: Session) -> list:
    companies = db.query(Company).order_by(Company.company_name).all()
    result = []
    for c in companies:
        active_count = db.query(Placement).filter(
            Placement.company_id == c.company_id
        ).count()
        result.append({
            "id": str(c.company_id),
            "name": c.company_name,
            "location": f"{c.town_city}, {c.county}",
            "contactPerson": c.contact_person_name,
            "contactPhone": c.contact_person_phone,
            "contactEmail": "",      # extend model if needed
            "placementHistory": active_count,
            "activeStudents": active_count,
        })
    return result


def create_company(db: Session, data: CompanyCreate) -> Company:
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def update_company(db: Session, company_id: int, data: CompanyUpdate) -> Company:
    company = db.query(Company).filter(Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    return company


def delete_company(db: Session, company_id: int) -> None:
    company = db.query(Company).filter(Company.company_id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.services import company_service
from app.core.dependencies import get_current_user, require_coordinator

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("")
def list_companies(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all companies.
    Angular path: GET /api/v1/companies
    Used by: Coordinator → Company Database page
    """
    companies = company_service.get_all_companies(db)
    return {"data": companies}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_company(
    data: CompanyCreate,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    """Coordinator adds a new company to the database."""
    company = company_service.create_company(db, data)
    return {"data": {"id": company.company_id, "name": company.company_name}}


@router.patch("/{company_id}")
def update_company(
    company_id: int,
    data: CompanyUpdate,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    company = company_service.update_company(db, company_id, data)
    return {"data": {"id": company.company_id, "name": company.company_name}}


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    current_user: dict = Depends(require_coordinator),
    db: Session = Depends(get_db),
):
    company_service.delete_company(db, company_id)

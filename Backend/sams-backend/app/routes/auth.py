from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.auth import (
    StudentRegisterSchema,
    StaffRegisterSchema,
    LoginSchema,
    PasswordChangeSchema,
)
from app.services import auth_service
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_student(
    data: StudentRegisterSchema,
    db: Session = Depends(get_db),
):
    user = auth_service.register_student(db, data)
    return {"message": "Account created successfully", "user": user}


@router.post("/register/staff", status_code=status.HTTP_201_CREATED)
def register_staff(
    data: StaffRegisterSchema,
    db: Session = Depends(get_db),
):
    user = auth_service.register_staff(db, data)
    return {"message": "Staff account created", "user": user}


@router.post("/login")
def login(
    # ✅ Explicitly declare as JSON body — NOT form data, NOT OAuth2Form
    data: LoginSchema,
    db: Session = Depends(get_db),
):
    """
    Login endpoint — accepts JSON body:
    {
      "email": "user@example.com",
      "password": "secret",
      "role": "student"   (optional hint)
    }
    Returns: { access_token, token_type, user }
    """
    result = auth_service.login_user(db, data)
    return result


@router.post("/change-password")
def change_password(
    data: PasswordChangeSchema,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")
    auth_service.change_student_password(
        db,
        current_user["record"],
        data.current_password,
        data.new_password,
    )
    return {"message": "Password changed successfully"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
    }
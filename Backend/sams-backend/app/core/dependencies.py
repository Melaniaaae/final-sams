from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import decode_token
from app.models.student import Student
from app.models.staff import Staff

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _get_current_user_payload(
    token: str = Depends(oauth2_scheme),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    return payload


def get_current_user(
    payload: dict = Depends(_get_current_user_payload),
    db: Session = Depends(get_db),
) -> dict:
    email: Optional[str] = payload.get("sub")
    role:  Optional[str] = payload.get("role")
    # ✅ Use the id stored directly in the token
    user_id: Optional[str] = payload.get("id")

    if not email or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is malformed",
        )

    if role == "student":
        # Look up by email (always reliable, even if reg_no has slashes)
        user = db.query(Student).filter(Student.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Student account not found",
            )
        return {
            "id":     user.reg_no,
            "email":  user.email,
            "role":   "student",
            "name":   user.name,
            "record": user,
        }
    else:
        user = db.query(Staff).filter(Staff.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Staff account not found",
            )
        return {
            "id":     user.staff_id,
            "email":  user.email,
            "role":   user.role.value,
            "name":   user.name,
            "record": user,
        }


def require_student(
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")
    return current_user


def require_coordinator(
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "coordinator":
        raise HTTPException(status_code=403, detail="Coordinators only")
    return current_user


def require_staff(
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] not in ("lecturer", "coordinator"):
        raise HTTPException(status_code=403, detail="Staff only")
    return current_user
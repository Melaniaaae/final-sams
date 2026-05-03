from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


# ── Student Registration ───────────────────────────────────────────────────

class StudentRegisterSchema(BaseModel):
    name: str
    registrationNumber: str
    email: EmailStr
    phone: str
    company: str
    location: dict          # { "county": str, "city": str }
    stationSupervisor: str
    stationSupervisorPhone: str
    startDate: str
    endDate: str
    role: str = "student"
    password: str = "Sams@2025"

    @field_validator("registrationNumber")
    def validate_reg_no(cls, value):
          if len(value) < 3:
              raise ValueError("Registration number too short")
          return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Remove spaces, dashes, parentheses
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        # Accept: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX
        pattern = r"^(?:\+254[17]\d{8}|0[17]\d{8})$"
        if not re.match(pattern, cleaned):
            raise ValueError(
                "Enter a valid Kenyan phone number "
                "(e.g. 0712345678 or +254712345678)"
            )
        return cleaned

    @field_validator("startDate", "endDate")
    @classmethod
    def validate_date(cls, v: str) -> str:
        from datetime import date
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be in format YYYY-MM-DD")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("company")
    @classmethod
    def validate_company(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Company name must be at least 2 characters")
        return v


class StaffRegisterSchema(BaseModel):
    name: str
    staff_id: str
    email: EmailStr
    department: str
    phone_number: str
    role: str           # "lecturer" or "coordinator"
    password: str


# ── Login ──────────────────────────────────────────────────────────────────

class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None


# ── Responses ─────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    registrationNumber: Optional[str] = None
class StudentPublic(UserOut):
    pass


class StaffPublic(UserOut):
    pass

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Password change ───────────────────────────────────────────────────────

class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v
import enum
from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship
from app.database.base import Base


class StaffRole(str, enum.Enum):
    lecturer = "lecturer"
    coordinator = "coordinator"


class Staff(Base):
    __tablename__ = "staff"

    staff_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    role = Column(Enum(StaffRole), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    assigned_students = relationship("Student", back_populates="supervisor")
    field_visits = relationship("FieldVisit", back_populates="supervisor")

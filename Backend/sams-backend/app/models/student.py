from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Student(Base):
    __tablename__ = "students"

    reg_no = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone_number = Column(String(20), nullable=False)
    department = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # FK to staff (university supervisor assigned by coordinator)
    staff_id = Column(String(50), ForeignKey("staff.staff_id"), nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    supervisor = relationship("Staff", back_populates="assigned_students")
    placements = relationship("Placement", back_populates="student", cascade="all, delete-orphan")
    final_reports = relationship("FinalReport", back_populates="student", cascade="all, delete-orphan")
    field_visits = relationship("FieldVisit", back_populates="student")

from sqlalchemy import Column, String, Date, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Placement(Base):
    __tablename__ = "placements"

    placement_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id", ondelete="RESTRICT"), nullable=False)
    reg_no = Column(String(50), ForeignKey("students.reg_no", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    company = relationship("Company", back_populates="placements")
    student = relationship("Student", back_populates="placements")
    weekly_logs = relationship("WeeklyLog", back_populates="placement", cascade="all, delete-orphan")
    field_visits = relationship("FieldVisit", back_populates="placement")

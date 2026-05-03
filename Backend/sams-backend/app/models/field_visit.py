from sqlalchemy import Column, String, Integer, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


class FieldVisit(Base):
    __tablename__ = "field_visits"

    visit_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    placement_id = Column(Integer, ForeignKey("placements.placement_id", ondelete="CASCADE"), nullable=False)
    reg_no = Column(String(50), ForeignKey("students.reg_no", ondelete="CASCADE"), nullable=False)
    staff_id = Column(String(50), ForeignKey("staff.staff_id", ondelete="RESTRICT"), nullable=False)
    visit_date = Column(Date, nullable=False)
    comments = Column(Text, nullable=True)
    visit_form_upload = Column(String(500), nullable=True)   # file path

    # ── Relationships ──────────────────────────────────────────────────────
    placement = relationship("Placement", back_populates="field_visits")
    student = relationship("Student", back_populates="field_visits")
    supervisor = relationship("Staff", back_populates="field_visits")

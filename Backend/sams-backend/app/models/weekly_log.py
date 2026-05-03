from sqlalchemy import Column, String, Integer, ForeignKey, Date, Text, Enum
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum


class LogStatus(str, enum.Enum):
    submitted = "submitted"
    reviewed = "reviewed"
    missing = "missing"


class WeeklyLog(Base):
    __tablename__ = "weekly_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    placement_id = Column(Integer, ForeignKey("placements.placement_id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.company_id", ondelete="RESTRICT"), nullable=False)
    week_no = Column(Integer, nullable=False)
    activity_description = Column(Text, nullable=False)
    logbook_file_upload = Column(String(500), nullable=True)   # file path
    submission_date = Column(Date, nullable=False)
    station_supervisor_name = Column(String(100), nullable=False)
    station_supervisor_phone = Column(String(20), nullable=False)
    status = Column(Enum(LogStatus), default=LogStatus.submitted, nullable=False)
    reviewer_comment = Column(Text, nullable=True)

    # ── Relationships ──────────────────────────────────────────────────────
    placement = relationship("Placement", back_populates="weekly_logs")
    company = relationship("Company", back_populates="weekly_logs")

from sqlalchemy import Column, String, Integer, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum


class CompletionStatus(str, enum.Enum):
    pending = "pending"
    submitted = "submitted"
    graded = "graded"
    completed = "completed"


class FinalReport(Base):
    __tablename__ = "final_reports"

    report_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    reg_no = Column(String(50), ForeignKey("students.reg_no", ondelete="CASCADE"), nullable=False, unique=True)
    submission_date = Column(Date, nullable=True)
    report_file_upload = Column(String(500), nullable=True)   # file path
    completion_status = Column(
        Enum(CompletionStatus),
        default=CompletionStatus.pending,
        nullable=False,
    )

    # ── Relationships ──────────────────────────────────────────────────────
    student = relationship("Student", back_populates="final_reports")

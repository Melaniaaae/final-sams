from sqlalchemy import Column, String, Float, Integer
from sqlalchemy.orm import relationship
from app.database.base import Base


class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    company_name = Column(String(200), nullable=False)
    industry = Column(String(100), nullable=False)
    location_lat = Column(Float, nullable=True)
    location_long = Column(Float, nullable=True)
    town_city = Column(String(100), nullable=False)
    county = Column(String(100), nullable=False)
    contact_person_name = Column(String(100), nullable=False)
    contact_person_phone = Column(String(20), nullable=False)

    # ── Relationships ──────────────────────────────────────────────────────
    placements = relationship("Placement", back_populates="company")
    weekly_logs = relationship("WeeklyLog", back_populates="company")

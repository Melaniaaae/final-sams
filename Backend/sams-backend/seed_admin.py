import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.connection import engine, SessionLocal
from app.models.staff import Staff, StaffRole
from app.core.security import hash_password

def seed_admin():
    db = SessionLocal()
    try:
        email = "admincoord@gmail.com"
        staff = db.query(Staff).filter(Staff.email == email).first()
        if not staff:
            admin = Staff(
                staff_id="COORD-001",
                name="System Administrator",
                email=email,
                department="Management",
                phone_number="+254700000000",
                role=StaffRole.coordinator,
                hashed_password=hash_password("samsadmin44"),
            )
            db.add(admin)
            db.commit()
            print("Admin created successfully.")
        else:
            # Update password just in case
            staff.hashed_password = hash_password("samsadmin44")
            db.commit()
            print("Admin already exists. Password updated.")
    except Exception as e:
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()

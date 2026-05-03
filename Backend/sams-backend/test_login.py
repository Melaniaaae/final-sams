import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.connection import engine, SessionLocal
from app.models.staff import Staff
from app.core.security import verify_password

def test_login():
    db = SessionLocal()
    try:
        email = "admincoord@gmail.com"
        staff = db.query(Staff).filter(Staff.email == email).first()
        if not staff:
            print("Staff not found.")
            return

        print(f"Found staff: {staff.email}, hashed_password: {staff.hashed_password}")
        is_valid = verify_password("samsadmin44", staff.hashed_password)
        print(f"Password 'samsadmin44' is valid: {is_valid}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_login()

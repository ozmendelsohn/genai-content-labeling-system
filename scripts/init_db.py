import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, create_db_and_tables, engine
from backend.models import User

def init_db():
    # Create tables
    create_db_and_tables()

    db = SessionLocal()

    # Check if admin user already exists
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(email="admin@example.com", role="admin")
        db.add(admin_user)
        print("Admin user created.")
    else:
        print("Admin user already exists.")

    # Add labeler users
    labeler_emails = [
        "labeler1@example.com",
        "labeler2@example.com",
        "labeler3@example.com",
    ]

    for email in labeler_emails:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, role="labeler")
            db.add(user)
            print(f"Labeler user {email} created.")
        else:
            print(f"Labeler user {email} already exists.")
    
    db.commit()
    db.close()
    print("Database initialized and initial users added.")

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization complete.")

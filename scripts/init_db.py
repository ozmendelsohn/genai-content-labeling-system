import sys
import os

# The following sys.path.append is for local execution outside Docker.
# When running inside Docker via `docker-compose exec`, the PYTHONPATH is set
# by the Dockerfile, and /app/src (containing models, database) should be on it.
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session # Added for type hinting

# Imports assume that /app/src is on PYTHONPATH, making 'database' and 'models' top-level.
from database import SessionLocal, engine, create_db_and_tables
from models import User as UserModel

def init_db():
    # Create tables. `checkfirst=True` is set in create_db_and_tables in database.py
    create_db_and_tables(engine_to_use=engine) # Pass the engine

    db: Session = SessionLocal()
    try:
        users_to_add = [
            {"id": 1, "email": "admin@example.com", "role": "admin"},
            {"id": 2, "email": "labeler1@example.com", "role": "labeler"},
            {"id": 3, "email": "labeler2@example.com", "role": "labeler"},
            {"id": 4, "email": "labeler3@example.com", "role": "labeler"},
        ]

        for user_data in users_to_add:
            user_exists_by_email = db.query(UserModel).filter(UserModel.email == user_data["email"]).first()
            
            if not user_exists_by_email:
                # If email doesn't exist, check if ID is taken by another user (defensive check)
                user_exists_by_id = db.query(UserModel).filter(UserModel.id == user_data["id"]).first()
                if user_exists_by_id:
                    print(f"Error: User with ID {user_data['id']} already exists with a different email ({user_exists_by_id.email}). Cannot add {user_data['email']}.")
                    continue

                db_user = UserModel(
                    id=user_data["id"],
                    email=user_data["email"],
                    role=user_data["role"]
                )
                db.add(db_user)
                print(f"User {user_data['email']} with ID {user_data['id']} added.")
            else:
                # User with this email already exists. Check if it's the same user (same ID, same role).
                if user_exists_by_email.id == user_data["id"] and user_exists_by_email.role == user_data["role"]:
                    print(f"User {user_data['email']} with ID {user_data['id']} already exists and matches.")
                else:
                    print(f"Warning: User {user_data['email']} already exists, but with different details. DB: (ID: {user_exists_by_email.id}, Role: {user_exists_by_email.role}), Script: (ID: {user_data['id']}, Role: {user_data['role']}). No changes made.")
        
        db.commit()
    except Exception as e:
        print(f"An error occurred during database initialization: {e}")
        db.rollback()
    finally:
        db.close()
    print("Database initialization and user check/addition process complete.")

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization complete.")

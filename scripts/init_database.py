#!/usr/bin/env python3
"""
Database Initialization Script

This script initializes the database with tables and optionally creates
a default admin user for development.
"""

import sys
import os
from pathlib import Path

# Add the backend src directory to the Python path
backend_src_path = Path(__file__).parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_src_path))

def init_database():
    """Initialize the database with tables"""
    
    try:
        from database import Base, engine, get_db
        from models import User, UserRole
        from datetime import datetime
        
        print("🔄 Creating database tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables created successfully!")
        
        # Check if we should create a default admin user
        db = next(get_db())
        try:
            existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
            
            if not existing_admin:
                print("👤 Creating default admin user...")
                
                admin_user = User(
                    username="admin",
                    email=None,  # Email is now optional
                    full_name="System Administrator",
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                # Set default password
                admin_user.set_password("admin123!")
                
                db.add(admin_user)
                db.commit()
                
                print("✅ Default admin user created!")
                print("   Username: admin")
                print("   Password: admin123!")
                print("   ⚠️  Please change the password after first login!")
            else:
                print("👤 Admin user already exists, skipping creation")
                
        finally:
            db.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting database initialization...")
    success = init_database()
    
    if success:
        print("🎉 Database initialization completed successfully!")
        sys.exit(0)
    else:
        print("💥 Database initialization failed!")
        sys.exit(1) 
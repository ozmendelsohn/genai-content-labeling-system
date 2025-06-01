#!/usr/bin/env python3
"""
Database Initialization Script

This script initializes the database with all required tables
and creates a default admin user for the GenAI Content Labeling System.
"""

import sys
import os
from pathlib import Path

# Add the backend src directory to the Python path
backend_src = Path(__file__).parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_src))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import SQLALCHEMY_DATABASE_URL
from models import Base, User, UserRole, ContentItem, Label, AuditLog, SystemMetrics, UserSession
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database():
    """Create all database tables"""
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully!")
        
        return engine
    except Exception as e:
        logger.error(f"❌ Error creating database tables: {e}")
        raise

def create_default_admin(engine):
    """Create a default admin user"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            logger.info("ℹ️  Admin user already exists, skipping creation")
            db.close()
            return
        
        # Create default admin user
        admin_user = User(
            username="admin",
            email="admin@genai-labeler.com",
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        
        # Set default password (should be changed on first login)
        admin_user.set_password("admin123!")
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        logger.info("✅ Default admin user created successfully!")
        logger.info("   Username: admin")
        logger.info("   Email: admin@genai-labeler.com")
        logger.info("   Password: admin123!")
        logger.info("   ⚠️  Please change the default password after first login!")
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Error creating default admin user: {e}")
        raise

def create_sample_data(engine):
    """Initialize basic system metrics for production"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if system metrics already exist
        existing_metrics = db.query(SystemMetrics).first()
        if existing_metrics:
            logger.info("ℹ️  System metrics already exist, skipping creation")
            db.close()
            return
        
        # Create basic system metrics (no sample users or content)
        initial_metrics = [
            SystemMetrics(metric_name="total_users", metric_value=1.0),  # Only admin user
            SystemMetrics(metric_name="total_content_items", metric_value=0.0),  # No sample content
            SystemMetrics(metric_name="system_accuracy", metric_value=0.0),  # No data yet
            SystemMetrics(metric_name="labels_today", metric_value=0.0),  # No labels yet
        ]
        
        for metric in initial_metrics:
            db.add(metric)
        
        db.commit()
        
        logger.info("✅ Basic system metrics initialized!")
        logger.info("   System ready for production use")
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Error creating system metrics: {e}")
        raise

def main():
    """Main initialization function"""
    logger.info("🚀 Starting database initialization...")
    
    try:
        # Create database tables
        engine = create_database()
        
        # Create default admin user
        create_default_admin(engine)
        
        # Initialize basic system metrics
        create_sample_data(engine)
        
        logger.info("🎉 Database initialization completed successfully!")
        logger.info("")
        logger.info("📋 Summary:")
        logger.info("   • Database tables created")
        logger.info("   • Default admin user created (admin / admin123!)")
        logger.info("   • System metrics initialized")
        logger.info("   • System ready for production use")
        logger.info("")
        logger.info("⚠️  Security Notice:")
        logger.info("   Please change the default admin password after first login!")
        logger.info("")
        logger.info("🚀 Next Steps:")
        logger.info("   1. Log in as admin (admin / admin123!)")
        logger.info("   2. Change the default password")
        logger.info("   3. Create labeler and viewer users as needed")
        logger.info("   4. Upload URLs for labeling tasks")
        
    except Exception as e:
        logger.error(f"💥 Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

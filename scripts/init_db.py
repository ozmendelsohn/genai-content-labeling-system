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
    """Create some sample data for testing"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if sample data already exists
        existing_content = db.query(ContentItem).first()
        if existing_content:
            logger.info("ℹ️  Sample data already exists, skipping creation")
            db.close()
            return
        
        # Create sample labeler user
        labeler_user = User(
            username="labeler1",
            email="labeler1@genai-labeler.com",
            full_name="Sample Labeler",
            role=UserRole.LABELER,
            is_active=True,
            is_verified=True
        )
        labeler_user.set_password("labeler123!")
        db.add(labeler_user)
        db.commit()
        db.refresh(labeler_user)
        
        # Create sample viewer user
        viewer_user = User(
            username="viewer1",
            email="viewer1@genai-labeler.com",
            full_name="Sample Viewer",
            role=UserRole.VIEWER,
            is_active=True,
            is_verified=True
        )
        viewer_user.set_password("viewer123!")
        db.add(viewer_user)
        db.commit()
        db.refresh(viewer_user)
        
        # Create sample content items
        sample_urls = [
            "https://example.com/article1",
            "https://example.com/article2",
            "https://example.com/article3",
            "https://example.com/blog-post",
            "https://example.com/news-article"
        ]
        
        content_items = []
        for i, url in enumerate(sample_urls):
            content_item = ContentItem(
                url=url,
                title=f"Sample Article {i+1}",
                description=f"This is a sample article for testing purposes - Article {i+1}",
                priority=3,
                assigned_user_id=labeler_user.id if i % 2 == 0 else None
            )
            content_items.append(content_item)
            db.add(content_item)
        
        db.commit()
        
        # Create sample system metrics
        sample_metrics = [
            SystemMetrics(metric_name="total_users", metric_value=3.0),
            SystemMetrics(metric_name="total_content_items", metric_value=len(sample_urls)),
            SystemMetrics(metric_name="system_accuracy", metric_value=89.3),
            SystemMetrics(metric_name="labels_today", metric_value=15.0),
        ]
        
        for metric in sample_metrics:
            db.add(metric)
        
        db.commit()
        
        logger.info("✅ Sample data created successfully!")
        logger.info(f"   Created {len(sample_urls)} sample content items")
        logger.info("   Created sample labeler user: labeler1 / labeler123!")
        logger.info("   Created sample viewer user: viewer1 / viewer123!")
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Error creating sample data: {e}")
        raise

def main():
    """Main initialization function"""
    logger.info("🚀 Starting database initialization...")
    
    try:
        # Create database tables
        engine = create_database()
        
        # Create default admin user
        create_default_admin(engine)
        
        # Create sample data
        create_sample_data(engine)
        
        logger.info("🎉 Database initialization completed successfully!")
        logger.info("")
        logger.info("📋 Summary:")
        logger.info("   • Database tables created")
        logger.info("   • Default admin user created (admin / admin123!)")
        logger.info("   • Sample labeler created (labeler1 / labeler123!)")
        logger.info("   • Sample viewer created (viewer1 / viewer123!)")
        logger.info("   • Sample content items created")
        logger.info("")
        logger.info("⚠️  Security Notice:")
        logger.info("   Please change all default passwords before production use!")
        
    except Exception as e:
        logger.error(f"💥 Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

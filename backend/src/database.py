"""
Database Configuration for GenAI Content Labeling System

This module configures the SQLAlchemy database connection and provides
session management for the application.
"""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger(__name__)

# Database URL from environment variable or default to SQLite
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./genai_labeling.db"
)

def ensure_database_directory():
    """
    Ensure the database directory exists for SQLite databases
    """
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        # Extract file path from SQLite URL
        db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
        
        # Handle relative vs absolute paths
        if not os.path.isabs(db_path):
            # For relative paths, ensure they're relative to the app directory
            db_path = os.path.join(os.getcwd(), db_path)
        
        # Create directory if it doesn't exist
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            logger.info(f"📁 Created database directory: {db_dir}")
        
        logger.info(f"💾 Database will be created at: {db_path}")

# Ensure database directory exists before creating engine
ensure_database_directory()

# Create engine
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # SQLite specific configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False},
        echo=False  # Set to True for SQL debugging
    )
else:
    # PostgreSQL or other database configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        echo=False  # Set to True for SQL debugging
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """
    Dependency function to get database session
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Create all database tables
    
    This function creates all tables defined in the models.
    It's safe to call multiple times as it only creates tables that don't exist.
    """
    from models import Base  # Import here to avoid circular imports
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """
    Drop all database tables
    
    Warning: This will delete all data in the database!
    Only use this for development/testing purposes.
    """
    from models import Base  # Import here to avoid circular imports
    Base.metadata.drop_all(bind=engine)

def reset_database():
    """
    Reset the database by dropping and recreating all tables
    
    Warning: This will delete all data in the database!
    Only use this for development/testing purposes.
    """
    drop_tables()
    create_tables()

# Legacy function for backward compatibility
def create_db_and_tables(engine_to_use=None):
    """
    Legacy function to create database tables
    
    Args:
        engine_to_use: Optional engine to use (defaults to global engine)
    """
    if engine_to_use is None:
        engine_to_use = engine
    
    from models import Base  # Import here to avoid circular imports
    Base.metadata.create_all(bind=engine_to_use) 



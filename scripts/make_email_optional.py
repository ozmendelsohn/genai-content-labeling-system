#!/usr/bin/env python3
"""
Database Migration: Make Email Optional

This script makes the email column nullable in the users table
to support username-only signup.
"""

import sys
import os
import sqlite3
from pathlib import Path

# Add the backend src directory to the Python path
backend_src_path = Path(__file__).parent.parent / "backend" / "src"
sys.path.insert(0, str(backend_src_path))

def make_email_optional():
    """Make the email column nullable in the users table"""
    
    # Database path
    db_path = Path(__file__).parent.parent / "data" / "genai_labeling.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        print("🔄 Making email column optional in users table...")
        
        # SQLite doesn't support ALTER COLUMN directly, so we need to:
        # 1. Create a new table with the correct schema
        # 2. Copy data from old table
        # 3. Drop old table
        # 4. Rename new table
        
        # First, check if the table exists and get current data
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("❌ Users table not found")
            return False
        
        # Get current table schema
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        print(f"📋 Current table has {len(columns)} columns")
        
        # Create new table with nullable email
        create_new_table_sql = """
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            hashed_password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'labeler',
            is_active BOOLEAN NOT NULL DEFAULT 1,
            is_verified BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            login_count INTEGER NOT NULL DEFAULT 0,
            profile_image_url VARCHAR(500),
            bio TEXT,
            preferences TEXT
        )
        """
        
        cursor.execute(create_new_table_sql)
        print("✅ Created new users table with nullable email")
        
        # Copy data from old table to new table
        cursor.execute("""
            INSERT INTO users_new (
                id, username, email, hashed_password, full_name, role,
                is_active, is_verified, created_at, updated_at, last_login,
                login_count, profile_image_url, bio, preferences
            )
            SELECT 
                id, username, email, hashed_password, full_name, role,
                is_active, is_verified, created_at, updated_at, last_login,
                login_count, profile_image_url, bio, preferences
            FROM users
        """)
        
        rows_copied = cursor.rowcount
        print(f"✅ Copied {rows_copied} user records")
        
        # Drop old table
        cursor.execute("DROP TABLE users")
        print("✅ Dropped old users table")
        
        # Rename new table
        cursor.execute("ALTER TABLE users_new RENAME TO users")
        print("✅ Renamed new table to users")
        
        # Recreate indexes
        cursor.execute("CREATE UNIQUE INDEX idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX idx_users_id ON users(id)")
        print("✅ Recreated indexes")
        
        # Commit changes
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Verify the change
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        email_column = next((col for col in columns if col[1] == 'email'), None)
        
        if email_column and email_column[3] == 0:  # notnull = 0 means nullable
            print("✅ Email column is now nullable")
        else:
            print("⚠️  Warning: Email column may not be properly nullable")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
        return False
        
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚀 Starting email optional migration...")
    success = make_email_optional()
    
    if success:
        print("🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        print("💥 Migration failed!")
        sys.exit(1) 
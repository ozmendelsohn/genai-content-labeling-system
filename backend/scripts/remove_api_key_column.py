#!/usr/bin/env python3
"""
Database Migration Script: Remove API Key Column

This script removes the gemini_api_key column from the users table
as part of the security enhancement to move API key storage to frontend-only.
"""

import sys
import os
import sqlite3
from pathlib import Path

# Add parent directory to path to import our modules
sys.path.append(str(Path(__file__).parent.parent / "src"))

def remove_api_key_column():
    """
    Remove the gemini_api_key column from the users table
    """
    # Database path
    db_path = Path(__file__).parent.parent / "content_detector.db"
    
    if not db_path.exists():
        print(f"❌ Database file not found at {db_path}")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        print("🔄 Starting API key column removal migration...")
        
        # Check if the column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'gemini_api_key' not in column_names:
            print("✅ gemini_api_key column does not exist. Migration not needed.")
            conn.close()
            return True
        
        print("📋 Found gemini_api_key column. Proceeding with removal...")
        
        # SQLite doesn't support DROP COLUMN directly, so we need to:
        # 1. Create a new table without the column
        # 2. Copy data from old table to new table
        # 3. Drop old table and rename new table
        
        # Step 1: Create new users table without gemini_api_key
        create_new_table_sql = """
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role VARCHAR(10) NOT NULL DEFAULT 'labeler',
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
        print("✅ Created new users table without gemini_api_key column")
        
        # Step 2: Copy data from old table to new table (excluding gemini_api_key)
        copy_data_sql = """
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
        """
        
        cursor.execute(copy_data_sql)
        rows_copied = cursor.rowcount
        print(f"✅ Copied {rows_copied} user records to new table")
        
        # Step 3: Drop old table and rename new table
        cursor.execute("DROP TABLE users")
        cursor.execute("ALTER TABLE users_new RENAME TO users")
        print("✅ Replaced old users table with new table")
        
        # Step 4: Recreate indexes
        indexes_sql = [
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username)",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)",
            "CREATE INDEX IF NOT EXISTS ix_users_id ON users (id)",
            "CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, is_active)"
        ]
        
        for index_sql in indexes_sql:
            cursor.execute(index_sql)
        
        print("✅ Recreated indexes")
        
        # Commit the transaction
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(users)")
        new_columns = cursor.fetchall()
        new_column_names = [col[1] for col in new_columns]
        
        if 'gemini_api_key' not in new_column_names:
            print("✅ Verification: gemini_api_key column successfully removed")
        else:
            print("❌ Verification failed: gemini_api_key column still exists")
            return False
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

def main():
    """Main function"""
    print("🔧 Database Migration: Remove API Key Column")
    print("=" * 50)
    
    if remove_api_key_column():
        print("\n🎉 Migration completed successfully!")
        print("✅ API keys are now managed on the frontend only for enhanced security.")
    else:
        print("\n❌ Migration failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main() 
"""
Database Models for GenAI Content Labeling System

This module defines all database models including users, roles, content,
and labeling data with proper relationships and constraints.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, Enum, Table, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from passlib.context import CryptContext

Base = declarative_base()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRole(enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    LABELER = "labeler"
    VIEWER = "viewer"

class ContentStatus(enum.Enum):
    """Content processing status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class LabelClassification(enum.Enum):
    """Label classification enumeration"""
    AI_GENERATED = "ai_generated"
    HUMAN_CREATED = "human_created"
    UNCERTAIN = "uncertain"

class User(Base):
    """
    User model for authentication and authorization
    
    Attributes:
        id: Primary key
        username: Unique username for login
        email: User's email address
        hashed_password: Bcrypt hashed password
        full_name: User's display name
        role: User role (admin, labeler, viewer)
        is_active: Whether user account is active
        is_verified: Whether email is verified
        created_at: Account creation timestamp
        updated_at: Last update timestamp
        last_login: Last login timestamp
        login_count: Number of times user has logged in
        profile_image_url: URL to user's profile image
        bio: User biography/description
        preferences: JSON field for user preferences
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.LABELER, nullable=False)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime)
    
    # User metrics
    login_count = Column(Integer, default=0, nullable=False)
    
    # Profile information
    profile_image_url = Column(String(500))
    bio = Column(Text)
    preferences = Column(Text)  # JSON string for user preferences
    
    # Relationships
    content_items = relationship("ContentItem", back_populates="assigned_user")
    labels = relationship("Label", back_populates="labeler")
    audit_logs = relationship("AuditLog", back_populates="user")

    def verify_password(self, password: str) -> bool:
        """Verify a password against the hashed password"""
        return pwd_context.verify(password, self.hashed_password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password for storing"""
        return pwd_context.hash(password)
    
    def set_password(self, password: str):
        """Set user password (hashes automatically)"""
        self.hashed_password = self.hash_password(password)
    
    def to_dict(self):
        """Convert user to dictionary (excluding sensitive data)"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "login_count": self.login_count,
            "profile_image_url": self.profile_image_url,
            "bio": self.bio
        }

class ContentItem(Base):
    """
    Content item model for URLs to be labeled
    
    Attributes:
        id: Primary key
        url: The URL to be labeled
        title: Page title (extracted)
        description: Page description (extracted)
        content_text: Extracted text content
        status: Processing status
        priority: Priority level (1-5, 5 being highest)
        assigned_user_id: ID of user assigned to label this content
        created_at: When content was added
        updated_at: Last update timestamp
        completed_at: When labeling was completed
        meta_data: Additional metadata as JSON
    """
    __tablename__ = "content_items"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(2048), nullable=False, index=True)
    title = Column(String(500))
    description = Column(Text)
    content_text = Column(Text)
    
    # Status and assignment
    status = Column(Enum(ContentStatus), default=ContentStatus.PENDING, nullable=False)
    priority = Column(Integer, default=3, nullable=False)  # 1-5 scale
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime)
    
    # Additional data
    meta_data = Column(Text)  # JSON string for additional metadata
    
    # Relationships
    assigned_user = relationship("User", back_populates="content_items")
    labels = relationship("Label", back_populates="content_item")

class Label(Base):
    """
    Label model for storing labeling results
    
    Attributes:
        id: Primary key
        content_item_id: Foreign key to content item
        labeler_id: Foreign key to user who created the label
        classification: AI/Human classification
        confidence_score: Confidence level (0-100)
        ai_indicators: JSON array of selected AI indicators
        human_indicators: JSON array of selected human indicators
        custom_tags: JSON array of custom tags
        notes: Additional notes from labeler
        time_spent_seconds: Time spent labeling in seconds
        created_at: When label was created
        updated_at: Last update timestamp
        is_final: Whether this is the final label
        review_status: Review status for quality control
    """
    __tablename__ = "labels"

    id = Column(Integer, primary_key=True, index=True)
    content_item_id = Column(Integer, ForeignKey("content_items.id"), nullable=False)
    labeler_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Classification data
    classification = Column(Enum(LabelClassification), nullable=False)
    confidence_score = Column(Integer, nullable=False)  # 0-100
    
    # Indicators and tags
    ai_indicators = Column(Text)  # JSON array
    human_indicators = Column(Text)  # JSON array
    custom_tags = Column(Text)  # JSON array
    notes = Column(Text)
    
    # Metrics
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Quality control
    is_final = Column(Boolean, default=True, nullable=False)
    review_status = Column(String(50), default="pending")  # pending, approved, rejected
    
    # Relationships
    content_item = relationship("ContentItem", back_populates="labels")
    labeler = relationship("User", back_populates="labels")

class AuditLog(Base):
    """
    Audit log for tracking user actions and system events
    
    Attributes:
        id: Primary key
        user_id: Foreign key to user (nullable for system events)
        action: Action performed
        resource_type: Type of resource affected
        resource_id: ID of affected resource
        details: Additional details as JSON
        ip_address: User's IP address
        user_agent: User's browser/client info
        created_at: When action occurred
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100))
    details = Column(Text)  # JSON string
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class SystemMetrics(Base):
    """
    System metrics for monitoring and analytics
    
    Attributes:
        id: Primary key
        metric_name: Name of the metric
        metric_value: Numeric value
        metric_data: Additional data as JSON
        recorded_at: When metric was recorded
    """
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float)
    metric_data = Column(Text)  # JSON string for complex metrics
    recorded_at = Column(DateTime, default=func.now(), nullable=False)

class UserSession(Base):
    """
    User session model for tracking active sessions
    
    Attributes:
        id: Primary key
        user_id: Foreign key to user
        session_token: Unique session token
        created_at: Session creation time
        expires_at: Session expiration time
        last_activity: Last activity timestamp
        ip_address: Session IP address
        user_agent: Session user agent
        is_active: Whether session is active
    """
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=func.now(), nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User")

# Create indexes for better performance
# Indexes for common queries
Index('idx_content_status_priority', ContentItem.status, ContentItem.priority)
Index('idx_labels_classification_confidence', Label.classification, Label.confidence_score)
Index('idx_audit_logs_action_created', AuditLog.action, AuditLog.created_at)
Index('idx_users_role_active', User.role, User.is_active)
Index('idx_sessions_token_active', UserSession.session_token, UserSession.is_active) 
"""
Pydantic Schemas for GenAI Content Labeling System

This module defines all Pydantic models for request/response validation,
including user management, authentication, and content labeling schemas.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRoleEnum(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    LABELER = "labeler"
    VIEWER = "viewer"

class ContentStatusEnum(str, Enum):
    """Content processing status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class LabelClassificationEnum(str, Enum):
    """Label classification enumeration"""
    AI_GENERATED = "ai_generated"
    HUMAN_CREATED = "human_created"
    UNCERTAIN = "uncertain"

# User Schemas
class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: Optional[EmailStr] = Field(None, description="User's email address (optional)")
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    role: UserRoleEnum = Field(default=UserRoleEnum.LABELER, description="User role")
    bio: Optional[str] = Field(None, max_length=1000, description="User biography")
    profile_image_url: Optional[str] = Field(None, max_length=500, description="Profile image URL")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must contain only alphanumeric characters, underscores, or hyphens')
        return v.lower()

class UserSignup(BaseModel):
    """Schema for user self-registration/signup"""
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    confirm_password: str = Field(..., description="Password confirmation")
    role: UserRoleEnum = Field(..., description="Desired user role (labeler or admin)")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must contain only alphanumeric characters, underscores, or hyphens')
        return v.lower()

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, values):
        if 'password' in values.data and v != values.data['password']:
            raise ValueError('Passwords do not match')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        # Allow only labeler and admin roles for signup
        if v not in [UserRoleEnum.LABELER, UserRoleEnum.ADMIN]:
            raise ValueError('Only labeler and admin roles are allowed for signup')
        return v

class UserCreate(UserBase):
    """Schema for creating a new user (Admin only)"""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    confirm_password: str = Field(..., description="Password confirmation")

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, values):
        if 'password' in values.data and v != values.data['password']:
            raise ValueError('Passwords do not match')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserUpdate(BaseModel):
    """Schema for updating user information"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    profile_image_url: Optional[str] = Field(None, max_length=500)
    preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")

class UserPasswordUpdate(BaseModel):
    """Schema for updating user password"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    confirm_password: str = Field(..., description="New password confirmation")

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, values):
        if 'new_password' in values.data and v != values.data['new_password']:
            raise ValueError('Passwords do not match')
        return v

class UserResponse(UserBase):
    """Schema for user response data"""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    login_count: int

    model_config = {"from_attributes": True}

class UserListResponse(BaseModel):
    """Schema for paginated user list response"""
    users: List[UserResponse]
    total: int
    page: int
    per_page: int
    pages: int

# Authentication Schemas
class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="User password")
    remember_me: bool = Field(default=False, description="Remember login session")

class LoginResponse(BaseModel):
    """Schema for login response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    """Schema for token data"""
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

# Content Item Schemas
class ContentItemBase(BaseModel):
    """Base content item schema"""
    url: str = Field(..., max_length=2048, description="URL to be labeled")
    title: Optional[str] = Field(None, max_length=500, description="Page title")
    description: Optional[str] = Field(None, description="Page description")
    priority: int = Field(default=3, ge=1, le=5, description="Priority level (1-5)")

class ContentItemCreate(ContentItemBase):
    """Schema for creating content items"""
    pass

class ContentItemUpdate(BaseModel):
    """Schema for updating content items"""
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None)
    priority: Optional[int] = Field(None, ge=1, le=5)
    status: Optional[ContentStatusEnum] = None
    assigned_user_id: Optional[int] = None

class ContentItemResponse(ContentItemBase):
    """Schema for content item response"""
    id: int
    status: ContentStatusEnum
    assigned_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    assigned_user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}

class ContentItemListResponse(BaseModel):
    """Schema for paginated content item list"""
    content_items: List[ContentItemResponse]
    total: int
    page: int
    per_page: int
    pages: int

# Label Schemas
class LabelBase(BaseModel):
    """Base label schema"""
    classification: LabelClassificationEnum = Field(..., description="AI/Human classification")
    confidence_score: int = Field(..., ge=0, le=100, description="Confidence level (0-100)")
    ai_indicators: List[str] = Field(default=[], description="Selected AI indicators")
    human_indicators: List[str] = Field(default=[], description="Selected human indicators")
    custom_tags: List[str] = Field(default=[], description="Custom tags")
    notes: Optional[str] = Field(None, description="Additional notes")
    time_spent_seconds: int = Field(default=0, ge=0, description="Time spent labeling")

class LabelCreate(LabelBase):
    """Schema for creating labels"""
    content_item_id: int = Field(..., description="Content item ID")

class LabelUpdate(BaseModel):
    """Schema for updating labels"""
    classification: Optional[LabelClassificationEnum] = None
    confidence_score: Optional[int] = Field(None, ge=0, le=100)
    ai_indicators: Optional[List[str]] = None
    human_indicators: Optional[List[str]] = None
    custom_tags: Optional[List[str]] = None
    notes: Optional[str] = None
    time_spent_seconds: Optional[int] = Field(None, ge=0)
    review_status: Optional[str] = None

class LabelResponse(LabelBase):
    """Schema for label response"""
    id: int
    content_item_id: int
    labeler_id: int
    created_at: datetime
    updated_at: datetime
    is_final: bool
    review_status: str
    labeler: UserResponse
    content_item: ContentItemResponse

    model_config = {"from_attributes": True}

class LabelListResponse(BaseModel):
    """Schema for paginated label list"""
    labels: List[LabelResponse]
    total: int
    page: int
    per_page: int
    pages: int

# Bulk Operations Schemas
class BulkContentUpload(BaseModel):
    """Schema for bulk content upload"""
    urls: List[str] = Field(..., min_length=1, max_length=100, description="List of URLs")
    priority: int = Field(default=3, ge=1, le=5, description="Priority for all URLs")
    auto_assign: bool = Field(default=True, description="Auto-assign to available labelers")
    notify_labelers: bool = Field(default=True, description="Send notifications to labelers")

class BulkUploadResponse(BaseModel):
    """Schema for bulk upload response"""
    success: bool
    message: str
    created_count: int
    failed_count: int
    failed_urls: List[str] = []

# Analytics Schemas
class UserStats(BaseModel):
    """Schema for user statistics"""
    total_labels: int
    labels_today: int
    labels_this_week: int
    labels_this_month: int
    average_time_per_label: float
    accuracy_score: Optional[float] = None

class SystemStats(BaseModel):
    """Schema for system statistics"""
    total_users: int
    active_users: int
    total_content_items: int
    pending_content_items: int
    completed_content_items: int
    total_labels: int
    labels_today: int
    average_accuracy: float

class DashboardData(BaseModel):
    """Schema for dashboard data"""
    user_stats: UserStats
    system_stats: SystemStats
    recent_activity: List[Dict[str, Any]]

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    """Schema for audit log response"""
    id: int
    user_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}

class AuditLogListResponse(BaseModel):
    """Schema for paginated audit log list"""
    audit_logs: List[AuditLogResponse]
    total: int
    page: int
    per_page: int
    pages: int

# Session Schemas
class SessionResponse(BaseModel):
    """Schema for session response"""
    id: int
    user_id: int
    created_at: datetime
    expires_at: datetime
    last_activity: datetime
    ip_address: Optional[str]
    user_agent: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}

# Error Schemas
class ErrorResponse(BaseModel):
    """Schema for error responses"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

class ValidationErrorResponse(BaseModel):
    """Schema for validation error responses"""
    error: str = "validation_error"
    message: str
    details: List[Dict[str, Any]]

# Success Schemas
class SuccessResponse(BaseModel):
    """Schema for success responses"""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

# Pagination Schemas
class PaginationParams(BaseModel):
    """Schema for pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$", description="Sort order")

class FilterParams(BaseModel):
    """Schema for filtering parameters"""
    search: Optional[str] = Field(None, description="Search query")
    role: Optional[UserRoleEnum] = Field(None, description="Filter by user role")
    status: Optional[ContentStatusEnum] = Field(None, description="Filter by content status")
    classification: Optional[LabelClassificationEnum] = Field(None, description="Filter by label classification")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")

# Legacy schemas for backward compatibility
class WebsiteCreate(BaseModel):
    """Legacy schema for website creation"""
    url: str
    is_active: bool = True

class Website(BaseModel):
    """Legacy schema for website response"""
    id: int
    url: str
    is_active: bool

    model_config = {"from_attributes": True}

class TaskResponse(BaseModel):
    """Schema for task response"""
    website_id: Optional[int] = None
    website_url: Optional[str] = None
    user_id: Optional[int] = None
    task_start_time: Optional[str] = None
    message_title: Optional[str] = None
    message_body: Optional[str] = None

    model_config = {"from_attributes": True}

# AI Analysis Schemas
class ContentAnalysisRequest(BaseModel):
    """Schema for requesting content analysis"""
    url: str = Field(..., description="URL to analyze")
    use_ai_analysis: bool = Field(default=True, description="Whether to use AI analysis")
    api_key: str = Field(..., description="Gemini API key for analysis")

class AIIndicatorPreselectionRequest(BaseModel):
    """Schema for requesting AI indicator preselection"""
    api_key: str = Field(..., description="Gemini API key for analysis")

class AIAnalysisResult(BaseModel):
    """Schema for AI analysis results"""
    classification: LabelClassificationEnum
    confidence_score: int = Field(..., ge=0, le=100)
    ai_indicators: List[str] = Field(default=[])
    human_indicators: List[str] = Field(default=[])
    reasoning: str
    analysis_timestamp: str
    model_used: str = "gemini-2.0-flash-001"
    word_count_analyzed: int = 0
    error: Optional[str] = None

class ContentExtractionResult(BaseModel):
    """Schema for content extraction results"""
    title: str
    description: str
    content_text: str
    word_count: int
    error: Optional[str] = None

class CompleteAnalysisResult(BaseModel):
    """Schema for complete content analysis result"""
    url: str
    content_extraction: ContentExtractionResult
    ai_analysis: AIAnalysisResult
    analysis_complete: bool
    timestamp: str

class ContentAnalysisResponse(BaseModel):
    """Schema for content analysis API response"""
    success: bool
    message: str
    analysis_result: Optional[CompleteAnalysisResult] = None
    suggested_content_item: Optional[ContentItemCreate] = None

class ContentItemCreateWithAI(ContentItemCreate):
    """Enhanced content item creation with AI analysis"""
    use_ai_analysis: bool = Field(default=True, description="Whether to use AI for pre-analysis")
    ai_analysis_result: Optional[AIAnalysisResult] = Field(None, description="AI analysis result if available")

# Enhanced User Schemas for API Key Management
class UserUpdateWithAI(UserUpdate):
    """Enhanced user update schema (API key management moved to frontend)"""
    pass  # No longer includes gemini_api_key

class UserResponseWithAI(UserResponse):
    """Enhanced user response with AI capabilities"""
    has_gemini_api_key: bool = Field(default=False, description="Whether user has configured Gemini API key") 
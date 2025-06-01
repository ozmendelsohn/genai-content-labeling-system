"""
FastAPI Main Application for GenAI Content Labeling System

This is the main FastAPI application that provides REST API endpoints
for user management, authentication, content management, and labeling.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import csv
import io
from datetime import datetime, timedelta
import asyncio
import os
import logging

# Import local modules
from database import get_db, engine, create_tables
from models import User, ContentItem, Label, UserRole, ContentStatus, LabelClassification, Base
from sqlalchemy import or_
from schemas import (
    UserCreate, UserSignup, UserResponse, UserUpdate, UserPasswordUpdate, UserListResponse,
    LoginRequest, LoginResponse, ContentItemCreate, ContentItemResponse, 
    ContentItemUpdate, ContentItemListResponse, LabelCreate, LabelResponse,
    LabelUpdate, LabelListResponse, BulkContentUpload, BulkUploadResponse,
    SystemStats, UserStats, DashboardData, PaginationParams, FilterParams,
    SuccessResponse, ErrorResponse,
    ContentAnalysisRequest, ContentAnalysisResponse, CompleteAnalysisResult,
    ContentItemCreateWithAI, UserUpdateWithAI, UserResponseWithAI, TaskResponse,
    AIIndicatorPreselectionRequest
)
from auth import (
    authenticate_user, create_access_token, get_current_user, get_current_active_user,
    require_admin, require_labeler, require_viewer, update_user_login,
    create_user_session, log_user_action, get_password_hash
)
from ai_service import create_ai_analyzer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3001,http://frontend:3001").split(",")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/genai_labeling.db")

def initialize_database():
    """
    Initialize database with tables and default admin user if needed
    """
    try:
        logger.info("🚀 Initializing database...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)

        
        logger.info("🎉 Database initialization completed!")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # Don't exit - let the application try to continue
        logger.warning("⚠️  Application will continue but may have issues")

# Create FastAPI app
app = FastAPI(
    title="GenAI Content Labeling System",
    description="A comprehensive system for labeling web content as AI-generated or human-created",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and other startup tasks"""
    initialize_database()

# Configure CORS with environment variables
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates for serving HTML (if needed)
templates = Jinja2Templates(directory="/app/templates")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Root endpoint
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Root endpoint serving basic info"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "title": "GenAI Content Labeling System",
        "description": "API for AI content detection and labeling"
    })

# Authentication Endpoints
@app.post("/auth/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token
    
    Args:
        login_data: Login credentials
        request: HTTP request object
        db: Database session
        
    Returns:
        LoginResponse: Access token and user information
    """
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    # Update user login info
    update_user_login(db, user, request)
    
    # Create session if remember_me is enabled
    if login_data.remember_me:
        create_user_session(db, user, request, remember_me=True)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=1800,  # 30 minutes
        user=UserResponse.from_orm(user)
    )

@app.post("/auth/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Logout current user
    
    Args:
        request: HTTP request object
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        SuccessResponse: Logout confirmation
    """
    # Log the logout action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="logout",
        resource_type="user",
        resource_id=str(current_user.id),
        request=request
    )
    
    return SuccessResponse(message="Successfully logged out")

@app.post("/auth/signup", response_model=UserResponse)
async def signup(
    signup_data: UserSignup,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    User self-registration endpoint
    
    Args:
        signup_data: User signup data including role selection
        request: HTTP request object
        db: Database session
        
    Returns:
        UserResponse: Created user information
    """
    # Check if username already exists
    existing_user = db.query(User).filter(
        User.username == signup_data.username.lower()
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose a different username."
        )
    
    # Create new user
    new_user = User(
        username=signup_data.username.lower(),
        email=None,  # No email required for signup
        full_name=signup_data.full_name,
        role=UserRole[signup_data.role.value.upper()],  # Convert to proper enum
        is_active=True,
        is_verified=True,  # Auto-verify for now, can be changed later
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Set password using the model's method
    new_user.set_password(signup_data.password)
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Log the signup action
        log_user_action(
            db=db,
            user_id=new_user.id,
            action="signup",
            resource_type="user",
            resource_id=str(new_user.id),
            request=request,
            details={"role": signup_data.role.value}
        )
        
        logger.info(f"✅ New user registered: {new_user.username} ({new_user.role.value})")
        
        return UserResponse.from_orm(new_user)
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to create user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account. Please try again."
        )

# User Management Endpoints
@app.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new user (Admin only)
    
    Args:
        user_data: User creation data
        request: HTTP request object
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        UserResponse: Created user information
    """
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username.lower()) | 
        (User.email == user_data.email.lower())
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    new_user = User(
        username=user_data.username.lower(),
        email=user_data.email.lower(),
        full_name=user_data.full_name,
        role=user_data.role,
        bio=user_data.bio,
        profile_image_url=user_data.profile_image_url,
        is_active=True,
        is_verified=True
    )
    
    # Set password
    new_user.set_password(user_data.password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="create_user",
        resource_type="user",
        resource_id=str(new_user.id),
        details={"created_user": new_user.username, "role": new_user.role.value},
        request=request
    )
    
    return UserResponse.from_orm(new_user)

@app.get("/users", response_model=UserListResponse)
async def list_users(
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all users with pagination and filtering (Admin only)
    
    Args:
        pagination: Pagination parameters
        filters: Filter parameters
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        UserListResponse: Paginated list of users
    """
    query = db.query(User)
    
    # Apply filters
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            (User.username.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )
    
    if filters.role:
        query = query.filter(User.role == filters.role)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.per_page
    users = query.offset(offset).limit(pagination.per_page).all()
    
    # Calculate pages
    pages = (total + pagination.per_page - 1) // pagination.per_page
    
    return UserListResponse(
        users=[UserResponse.from_orm(user) for user in users],
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
        pages=pages
    )

@app.get("/users/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user information
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UserResponse: Current user information
    """
    return UserResponse.from_orm(current_user)

@app.put("/users/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information
    
    Args:
        user_update: User update data
        request: HTTP request object
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        UserResponse: Updated user information
    """
    # Update user fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.profile_image_url is not None:
        current_user.profile_image_url = user_update.profile_image_url
    if user_update.preferences is not None:
        current_user.preferences = json.dumps(user_update.preferences)
    
    db.commit()
    db.refresh(current_user)
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="update_profile",
        resource_type="user",
        resource_id=str(current_user.id),
        request=request
    )
    
    return UserResponse.from_orm(current_user)

@app.put("/users/me/password")
async def update_password(
    password_update: UserPasswordUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user password
    
    Args:
        password_update: Password update data
        request: HTTP request object
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        SuccessResponse: Password update confirmation
    """
    # Verify current password
    if not current_user.verify_password(password_update.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.set_password(password_update.new_password)
    db.commit()
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="change_password",
        resource_type="user",
        resource_id=str(current_user.id),
        request=request
    )
    
    return SuccessResponse(message="Password updated successfully")

# Content Management Endpoints
@app.post("/content", response_model=ContentItemResponse)
async def create_content_item(
    content_data: ContentItemCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new content item (Admin only)
    
    Args:
        content_data: Content creation data
        request: HTTP request object
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        ContentItemResponse: Created content item
    """
    # Check if URL already exists
    existing_content = db.query(ContentItem).filter(ContentItem.url == content_data.url).first()
    if existing_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL already exists in the system"
        )
    
    # Create new content item
    content_item = ContentItem(
        url=content_data.url,
        title=content_data.title,
        description=content_data.description,
        priority=content_data.priority,
        status=ContentStatus.PENDING
    )
    
    db.add(content_item)
    db.commit()
    db.refresh(content_item)
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="create_content",
        resource_type="content_item",
        resource_id=str(content_item.id),
        details={"url": content_item.url},
        request=request
    )
    
    return ContentItemResponse.from_orm(content_item)

@app.post("/content/bulk", response_model=BulkUploadResponse)
async def bulk_upload_content(
    upload_data: BulkContentUpload,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Bulk upload content items (Admin only)
    
    Args:
        upload_data: Bulk upload data
        request: HTTP request object
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        BulkUploadResponse: Upload results
    """
    created_count = 0
    failed_count = 0
    failed_urls = []
    
    for url in upload_data.urls:
        try:
            # Check if URL already exists
            existing_content = db.query(ContentItem).filter(ContentItem.url == url).first()
            if existing_content:
                failed_count += 1
                failed_urls.append(url)
                continue
            
            # Create content item
            content_item = ContentItem(
                url=url,
                priority=upload_data.priority,
                status=ContentStatus.PENDING
            )
            
            # Auto-assign if requested
            if upload_data.auto_assign:
                # Find available labeler
                available_labeler = db.query(User).filter(
                    User.role == UserRole.LABELER,
                    User.is_active == True
                ).first()
                
                if available_labeler:
                    content_item.assigned_user_id = available_labeler.id
                    content_item.status = ContentStatus.IN_PROGRESS
            
            db.add(content_item)
            created_count += 1
            
        except Exception as e:
            failed_count += 1
            failed_urls.append(url)
    
    db.commit()
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="bulk_upload_content",
        resource_type="content_item",
        details={
            "created_count": created_count,
            "failed_count": failed_count,
            "total_urls": len(upload_data.urls)
        },
        request=request
    )
    
    return BulkUploadResponse(
        success=failed_count == 0,
        message=f"Successfully uploaded {created_count} URLs, {failed_count} failed",
        created_count=created_count,
        failed_count=failed_count,
        failed_urls=failed_urls
    )

@app.get("/content", response_model=ContentItemListResponse)
async def list_content_items(
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    current_user: User = Depends(require_viewer),
    db: Session = Depends(get_db)
):
    """
    List content items with pagination and filtering
    
    Args:
        pagination: Pagination parameters
        filters: Filter parameters
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        ContentItemListResponse: Paginated list of content items
    """
    query = db.query(ContentItem)
    
    # Apply filters
    if filters.status:
        query = query.filter(ContentItem.status == filters.status)
    
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            (ContentItem.url.ilike(search_term)) |
            (ContentItem.title.ilike(search_term)) |
            (ContentItem.description.ilike(search_term))
        )
    
    # For labelers, only show their assigned content
    if current_user.role == UserRole.LABELER:
        query = query.filter(ContentItem.assigned_user_id == current_user.id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (pagination.page - 1) * pagination.per_page
    content_items = query.offset(offset).limit(pagination.per_page).all()
    
    # Calculate pages
    pages = (total + pagination.per_page - 1) // pagination.per_page
    
    return ContentItemListResponse(
        content_items=[ContentItemResponse.from_orm(item) for item in content_items],
        total=total,
        page=pagination.page,
        per_page=pagination.per_page,
        pages=pages
    )

# Dashboard and Analytics Endpoints
@app.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard data for current user
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        DashboardData: Dashboard statistics and data
    """
    # User stats
    user_labels = db.query(Label).filter(Label.labeler_id == current_user.id)
    total_labels = user_labels.count()
    
    today = datetime.utcnow().date()
    labels_today = user_labels.filter(Label.created_at >= today).count()
    
    # System stats (for admins)
    if current_user.role == UserRole.ADMIN:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        total_content_items = db.query(ContentItem).count()
        pending_content_items = db.query(ContentItem).filter(
            ContentItem.status == ContentStatus.PENDING
        ).count()
        completed_content_items = db.query(ContentItem).filter(
            ContentItem.status == ContentStatus.COMPLETED
        ).count()
        total_system_labels = db.query(Label).count()
        system_labels_today = db.query(Label).filter(Label.created_at >= today).count()
        
        system_stats = SystemStats(
            total_users=total_users,
            active_users=active_users,
            total_content_items=total_content_items,
            pending_content_items=pending_content_items,
            completed_content_items=completed_content_items,
            total_labels=total_system_labels,
            labels_today=system_labels_today,
            average_accuracy=89.3  # This would be calculated from actual data
        )
    else:
        system_stats = SystemStats(
            total_users=0,
            active_users=0,
            total_content_items=0,
            pending_content_items=0,
            completed_content_items=0,
            total_labels=0,
            labels_today=0,
            average_accuracy=0.0
        )
    
    user_stats = UserStats(
        total_labels=total_labels,
        labels_today=labels_today,
        labels_this_week=total_labels,  # Simplified for now
        labels_this_month=total_labels,  # Simplified for now
        average_time_per_label=120.0,  # This would be calculated from actual data
        accuracy_score=85.5  # This would be calculated from actual data
    )
    
    # Recent activity (simplified)
    recent_activity = [
        {"action": "login", "timestamp": datetime.utcnow().isoformat(), "user": current_user.username}
    ]
    
    return DashboardData(
        user_stats=user_stats,
        system_stats=system_stats,
        recent_activity=recent_activity
    )

@app.get("/admin/labeling-analytics")
async def get_labeling_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive labeling analytics for admin dashboard
    
    Args:
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        Dict: Comprehensive labeling analytics including AI vs Human classification stats,
              labeler performance, time metrics, and trends
    """
    from sqlalchemy import func, case, extract
    
    # Classification Distribution
    classification_stats = db.query(
        Label.classification,
        func.count(Label.id).label('count'),
        func.avg(Label.confidence_score).label('avg_confidence'),
        func.avg(Label.time_spent_seconds).label('avg_time_spent')
    ).group_by(Label.classification).all()
    
    # Process classification data
    ai_generated_count = 0
    human_created_count = 0
    uncertain_count = 0
    ai_avg_confidence = 0
    human_avg_confidence = 0
    ai_avg_time = 0
    human_avg_time = 0
    
    for stat in classification_stats:
        if stat.classification == LabelClassification.AI_GENERATED:
            ai_generated_count = stat.count
            ai_avg_confidence = round(stat.avg_confidence or 0, 1)
            ai_avg_time = round(stat.avg_time_spent or 0, 1)
        elif stat.classification == LabelClassification.HUMAN_CREATED:
            human_created_count = stat.count
            human_avg_confidence = round(stat.avg_confidence or 0, 1)
            human_avg_time = round(stat.avg_time_spent or 0, 1)
        elif stat.classification == LabelClassification.UNCERTAIN:
            uncertain_count = stat.count
    
    total_labels = ai_generated_count + human_created_count + uncertain_count
    
    # Labeler Performance Stats
    labeler_stats = db.query(
        User.username,
        User.full_name,
        func.count(Label.id).label('total_labels'),
        func.sum(case((Label.created_at >= datetime.utcnow().date(), 1), else_=0)).label('labels_today'),
        func.avg(Label.time_spent_seconds).label('avg_time_per_label'),
        func.sum(Label.time_spent_seconds).label('total_time_spent'),
        func.avg(Label.confidence_score).label('avg_confidence')
    ).join(Label, User.id == Label.labeler_id).filter(
        User.role == UserRole.LABELER
    ).group_by(User.id, User.username, User.full_name).all()
    
    # Time-based trends (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_trends = db.query(
        func.date(Label.created_at).label('date'),
        func.count(Label.id).label('total_labels'),
        func.sum(case((Label.classification == LabelClassification.AI_GENERATED, 1), else_=0)).label('ai_labels'),
        func.sum(case((Label.classification == LabelClassification.HUMAN_CREATED, 1), else_=0)).label('human_labels'),
        func.avg(Label.time_spent_seconds).label('avg_time')
    ).filter(
        Label.created_at >= seven_days_ago
    ).group_by(func.date(Label.created_at)).order_by(func.date(Label.created_at)).all()
    
    # Quality metrics
    today = datetime.utcnow().date()
    quality_stats = db.query(
        func.count(Label.id).label('total_today'),
        func.avg(Label.time_spent_seconds).label('avg_time_today'),
        func.sum(case((Label.time_spent_seconds < 30, 1), else_=0)).label('quick_labels'),
        func.sum(case((Label.time_spent_seconds > 300, 1), else_=0)).label('thorough_labels')
    ).filter(Label.created_at >= today).first()
    
    # Format results
    classification_data = {
        'ai_generated': {
            'count': ai_generated_count,
            'percentage': round((ai_generated_count / total_labels * 100) if total_labels > 0 else 0, 1),
            'avg_confidence': ai_avg_confidence,
            'avg_time_seconds': ai_avg_time
        },
        'human_created': {
            'count': human_created_count,
            'percentage': round((human_created_count / total_labels * 100) if total_labels > 0 else 0, 1),
            'avg_confidence': human_avg_confidence,
            'avg_time_seconds': human_avg_time
        },
        'uncertain': {
            'count': uncertain_count,
            'percentage': round((uncertain_count / total_labels * 100) if total_labels > 0 else 0, 1)
        },
        'total': total_labels
    }
    
    labeler_performance = []
    for labeler in labeler_stats:
        labeler_performance.append({
            'username': labeler.username,
            'full_name': labeler.full_name or labeler.username,
            'total_labels': labeler.total_labels,
            'labels_today': labeler.labels_today,
            'avg_time_per_label_seconds': round(labeler.avg_time_per_label or 0, 1),
            'avg_time_per_label_minutes': round((labeler.avg_time_per_label or 0) / 60, 1),
            'total_time_spent_hours': round((labeler.total_time_spent or 0) / 3600, 1),
            'avg_confidence': round(labeler.avg_confidence or 0, 1),
            'productivity_score': round(labeler.total_labels / max(1, (labeler.total_time_spent or 1) / 3600), 1)
        })
    
    # Sort by total labels
    labeler_performance.sort(key=lambda x: x['total_labels'], reverse=True)
    
    trends = []
    for trend in daily_trends:
        trends.append({
            'date': str(trend.date),
            'total_labels': trend.total_labels,
            'ai_labels': trend.ai_labels,
            'human_labels': trend.human_labels,
            'avg_time_seconds': round(trend.avg_time or 0, 1)
        })
    
    quality_metrics = {
        'labels_today': quality_stats.total_today if quality_stats else 0,
        'avg_time_today_seconds': round(quality_stats.avg_time_today or 0, 1) if quality_stats else 0,
        'avg_time_today_minutes': round((quality_stats.avg_time_today or 0) / 60, 1) if quality_stats else 0,
        'quick_labels_count': quality_stats.quick_labels if quality_stats else 0,
        'thorough_labels_count': quality_stats.thorough_labels if quality_stats else 0,
        'quick_labels_percentage': round((quality_stats.quick_labels / max(1, quality_stats.total_today) * 100) if quality_stats and quality_stats.total_today > 0 else 0, 1),
        'thorough_labels_percentage': round((quality_stats.thorough_labels / max(1, quality_stats.total_today) * 100) if quality_stats and quality_stats.total_today > 0 else 0, 1)
    }
    
    return {
        'classification_distribution': classification_data,
        'labeler_performance': labeler_performance,
        'daily_trends': trends,
        'quality_metrics': quality_metrics,
        'summary': {
            'total_labelers': len(labeler_performance),
            'most_productive_labeler': labeler_performance[0]['username'] if labeler_performance else None,
            'avg_time_per_label_system': round(sum(l['avg_time_per_label_seconds'] for l in labeler_performance) / max(1, len(labeler_performance)), 1),
            'ai_human_ratio': round(ai_generated_count / max(1, human_created_count), 2) if human_created_count > 0 else float('inf')
        }
    }

@app.get("/admin/export-data")
async def export_dashboard_data(
    format: str = "csv",
    data_type: str = "urls",
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Export dashboard data in CSV or JSON format
    
    Args:
        format: Export format ('csv' or 'json')
        data_type: Type of data to export ('urls', 'labels', 'performance')
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        Response: File download response with exported data
    """
    if format not in ['csv', 'json']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format must be 'csv' or 'json'"
        )
    
    if data_type not in ['urls', 'labels', 'performance']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data type must be 'urls', 'labels', or 'performance'"
        )
    
    try:
        if data_type == 'urls':
            # Export content items
            content_items = db.query(ContentItem).all()
            data = []
            for item in content_items:
                data.append({
                    'id': item.id,
                    'url': item.url,
                    'title': item.title or '',
                    'description': item.description or '',
                    'status': item.status.value,
                    'priority': item.priority,
                    'assigned_user': item.assigned_user.username if item.assigned_user else '',
                    'created_at': item.created_at.isoformat(),
                    'updated_at': item.updated_at.isoformat(),
                    'completed_at': item.completed_at.isoformat() if item.completed_at else ''
                })
        
        elif data_type == 'labels':
            # Export labeling data
            labels = db.query(Label).join(ContentItem).join(User).all()
            data = []
            for label in labels:
                data.append({
                    'label_id': label.id,
                    'url': label.content_item.url,
                    'title': label.content_item.title or '',
                    'labeler': label.labeler.username,
                    'classification': label.classification.value,
                    'confidence_score': label.confidence_score,
                    'time_spent_seconds': label.time_spent_seconds,
                    'time_spent_minutes': round(label.time_spent_seconds / 60, 1),
                    'ai_indicators': label.ai_indicators or '',
                    'human_indicators': label.human_indicators or '',
                    'custom_tags': label.custom_tags or '',
                    'notes': label.notes or '',
                    'created_at': label.created_at.isoformat(),
                    'review_status': label.review_status
                })
        
        elif data_type == 'performance':
            # Export labeler performance data
            from sqlalchemy import func
            labeler_stats = db.query(
                User.username,
                User.full_name,
                func.count(Label.id).label('total_labels'),
                func.avg(Label.time_spent_seconds).label('avg_time_per_label'),
                func.sum(Label.time_spent_seconds).label('total_time_spent'),
                func.avg(Label.confidence_score).label('avg_confidence'),
                func.count(func.distinct(func.date(Label.created_at))).label('active_days')
            ).join(Label, User.id == Label.labeler_id).filter(
                User.role == UserRole.LABELER
            ).group_by(User.id, User.username, User.full_name).all()
            
            data = []
            for labeler in labeler_stats:
                data.append({
                    'username': labeler.username,
                    'full_name': labeler.full_name or '',
                    'total_labels': labeler.total_labels,
                    'avg_time_per_label_seconds': round(labeler.avg_time_per_label or 0, 1),
                    'avg_time_per_label_minutes': round((labeler.avg_time_per_label or 0) / 60, 1),
                    'total_time_spent_hours': round((labeler.total_time_spent or 0) / 3600, 1),
                    'avg_confidence': round(labeler.avg_confidence or 0, 1),
                    'active_days': labeler.active_days,
                    'productivity_score': round(labeler.total_labels / max(1, (labeler.total_time_spent or 1) / 3600), 1)
                })
        
        # Generate response based on format
        if format == 'csv':
            output = io.StringIO()
            if data:
                writer = csv.DictWriter(output, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
            
            csv_content = output.getvalue()
            output.close()
            
            filename = f"{data_type}_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        
        else:  # JSON format
            filename = f"{data_type}_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
            
            return Response(
                content=json.dumps({
                    'export_timestamp': datetime.utcnow().isoformat(),
                    'data_type': data_type,
                    'total_records': len(data),
                    'data': data
                }, indent=2),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )

# AI Integration Endpoints
@app.post("/ai/analyze-url", response_model=ContentAnalysisResponse)
async def analyze_url_content(
    analysis_request: ContentAnalysisRequest,
    request: Request,
    current_user: User = Depends(require_labeler),
    db: Session = Depends(get_db)
):
    """
    Analyze URL content using AI
    
    Args:
        analysis_request: Content analysis request with API key
        request: HTTP request object
        current_user: Current authenticated user with labeler permissions
        db: Database session
        
    Returns:
        ContentAnalysisResponse: Analysis results
    """
    try:
        # Create AI analyzer with provided API key
        ai_analyzer = create_ai_analyzer(analysis_request.api_key)
        
        if not ai_analyzer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize AI analyzer. Please check your API key."
            )
        
        # Perform analysis
        analysis_result = await ai_analyzer.analyze_url_async(analysis_request.url)
        
        # Create suggested content item based on analysis
        content_extraction = analysis_result["content_extraction"]
        ai_analysis = analysis_result["ai_analysis"]
        
        suggested_content = ContentItemCreate(
            url=analysis_request.url,
            title=content_extraction.get("title", ""),
            description=content_extraction.get("description", ""),
            priority=3  # Default priority
        )
        
        # Log the action (without API key details)
        log_user_action(
            db=db,
            user_id=current_user.id,
            action="analyze_url_content",
            resource_type="content_analysis",
            resource_id=analysis_request.url,
            details={
                "classification": ai_analysis.get("classification"),
                "confidence_score": ai_analysis.get("confidence_score"),
                "word_count": content_extraction.get("word_count", 0)
            },
            request=request
        )
        
        return ContentAnalysisResponse(
            success=True,
            message="Content analysis completed successfully",
            analysis_result=CompleteAnalysisResult(**analysis_result),
            suggested_content_item=suggested_content
        )
    
    except Exception as e:
        # Log the error
        log_user_action(
            db=db,
            user_id=current_user.id,
            action="analyze_url_content_failed",
            resource_type="content_analysis",
            resource_id=analysis_request.url,
            details={"error": str(e)},
            request=request
        )
        
        return ContentAnalysisResponse(
            success=False,
            message=f"Content analysis failed: {str(e)}",
            analysis_result=None,
            suggested_content_item=None
        )

@app.post("/ai/preselect-indicators")
async def preselect_indicators_for_task(
    preselection_request: AIIndicatorPreselectionRequest,
    request: Request,
    current_user: User = Depends(require_labeler),
    db: Session = Depends(get_db)
):
    """
    Get AI-powered pre-selection of indicators for the current user's active task
    
    Args:
        preselection_request: API key for AI analysis
        request: HTTP request object
        current_user: Current authenticated labeler user
        db: Database session
        
    Returns:
        Dict: Pre-selected indicators for the current task
    """
    # Find the user's current active task
    current_task = db.query(ContentItem).filter(
        ContentItem.assigned_user_id == current_user.id,
        ContentItem.status == ContentStatus.IN_PROGRESS
    ).first()
    
    if not current_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active task found for current user"
        )
    
    try:
        # Create AI analyzer with provided API key
        ai_analyzer = create_ai_analyzer(preselection_request.api_key)
        
        if not ai_analyzer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize AI analyzer. Please check your API key."
            )
        
        # Perform analysis
        analysis_result = await ai_analyzer.analyze_url_async(current_task.url)
        ai_analysis = analysis_result.get("ai_analysis", {})
        
        # Extract pre-selected indicators
        preselected_ai_indicators = ai_analysis.get("ai_indicators", [])
        preselected_human_indicators = ai_analysis.get("human_indicators", [])
        
        # Log the action (without API key details)
        log_user_action(
            db=db,
            user_id=current_user.id,
            action="ai_preselect_indicators",
            resource_type="content_item",
            resource_id=str(current_task.id),
            details={
                "url": current_task.url,
                "classification": ai_analysis.get("classification"),
                "confidence_score": ai_analysis.get("confidence_score"),
                "ai_indicators_count": len(preselected_ai_indicators),
                "human_indicators_count": len(preselected_human_indicators)
            },
            request=request
        )
        
        return {
            "success": True,
            "task_url": current_task.url,
            "classification": ai_analysis.get("classification", "uncertain"),
            "confidence_score": ai_analysis.get("confidence_score", 0),
            "preselected_ai_indicators": preselected_ai_indicators,
            "preselected_human_indicators": preselected_human_indicators,
            "reasoning": ai_analysis.get("reasoning", ""),
            "analysis_timestamp": ai_analysis.get("analysis_timestamp")
        }
    
    except Exception as e:
        # Log the error
        log_user_action(
            db=db,
            user_id=current_user.id,
            action="ai_preselect_indicators_failed",
            resource_type="content_item",
            resource_id=str(current_task.id),
            details={"error": str(e)},
            request=request
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preselect indicators: {str(e)}"
        )

@app.post("/content/with-ai", response_model=ContentItemResponse)
async def create_content_item_with_ai_analysis(
    content_data: ContentItemCreateWithAI,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new content item with optional AI pre-analysis
    
    Args:
        content_data: Content creation data with AI analysis option
        request: HTTP request object
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        ContentItemResponse: Created content item
    """
    # Check if URL already exists
    existing_content = db.query(ContentItem).filter(ContentItem.url == content_data.url).first()
    if existing_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL already exists in the system"
        )
    
    # Extract enhanced content data if AI analysis was performed
    enhanced_title = content_data.title
    enhanced_description = content_data.description
    
    if content_data.use_ai_analysis and content_data.ai_analysis_result:
        # If AI analysis was provided, we can potentially enhance the content item
        # This would come from the frontend after calling /ai/analyze-url
        pass
    
    # Create new content item
    content_item = ContentItem(
        url=content_data.url,
        title=enhanced_title,
        description=enhanced_description,
        priority=content_data.priority,
        status=ContentStatus.PENDING
    )
    
    db.add(content_item)
    db.commit()
    db.refresh(content_item)
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="create_content_with_ai",
        resource_type="content_item",
        resource_id=str(content_item.id),
        details={
            "url": content_item.url,
            "ai_analysis_used": content_data.use_ai_analysis,
            "has_ai_result": bool(content_data.ai_analysis_result)
        },
        request=request
    )
    
    return ContentItemResponse.from_orm(content_item)

@app.post("/admin/upload_urls", response_model=SuccessResponse)
async def admin_upload_urls(
    request: Request,
    urls_list: str = Form(...),
    reset_existing: bool = Form(default=False),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Upload URLs from admin interface with option to reset existing URLs
    
    Args:
        urls_list: Newline-separated list of URLs
        reset_existing: Whether to reset existing URLs to PENDING status
        request: HTTP request object
        current_user: Current authenticated admin user
        db: Database session
        
    Returns:
        SuccessResponse: Upload results with detailed feedback
    """
    # Parse URLs from string
    urls = [url.strip() for url in urls_list.split('\n') if url.strip()]
    
    if not urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid URLs provided"
        )
    
    created_count = 0
    reset_count = 0
    skipped_count = 0
    failed_count = 0
    existing_urls = []
    failed_urls = []
    
    for url in urls:
        try:
            # Check if URL already exists
            existing_content = db.query(ContentItem).filter(ContentItem.url == url).first()
            
            if existing_content:
                existing_urls.append(url)
                
                if reset_existing:
                    # Reset existing URL to PENDING status and clear assignment
                    existing_content.status = ContentStatus.PENDING
                    existing_content.assigned_user_id = None
                    existing_content.completed_at = None
                    reset_count += 1
                else:
                    # Skip existing URL
                    skipped_count += 1
                continue
            
            # Create new content item with PENDING status
            content_item = ContentItem(
                url=url,
                priority=3,  # Default priority
                status=ContentStatus.PENDING,
                assigned_user_id=None  # Don't pre-assign, let labelers pick up tasks
            )
            
            db.add(content_item)
            created_count += 1
            
        except Exception as e:
            failed_count += 1
            failed_urls.append(url)
    
    db.commit()
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="admin_upload_urls",
        resource_type="content_item",
        details={
            "created_count": created_count,
            "reset_count": reset_count,
            "skipped_count": skipped_count,
            "failed_count": failed_count,
            "total_urls": len(urls),
            "reset_existing": reset_existing
        },
        request=request
    )
    
    # Build detailed message
    message_parts = []
    
    if created_count > 0:
        message_parts.append(f"Created {created_count} new URLs")
    
    if reset_count > 0:
        message_parts.append(f"Reset {reset_count} existing URLs to pending")
    
    if skipped_count > 0:
        message_parts.append(f"Skipped {skipped_count} existing URLs")
    
    if failed_count > 0:
        message_parts.append(f"Failed to process {failed_count} URLs")
    
    if not message_parts:
        message = "No URLs were processed"
    else:
        message = "Upload completed: " + ", ".join(message_parts)
    
    return SuccessResponse(message=message)

@app.get("/labeler/task", response_model=TaskResponse)
async def get_labeler_task(
    request: Request,
    current_user: User = Depends(require_labeler),
    db: Session = Depends(get_db)
):
    """
    Get a task for the current authenticated labeler
    
    Args:
        request: HTTP request object
        current_user: Current authenticated labeler user
        db: Database session
        
    Returns:
        TaskResponse: Assigned task or no task message
    """
    # First check if the user already has an assigned task in progress
    existing_task = db.query(ContentItem).filter(
        ContentItem.assigned_user_id == current_user.id,
        ContentItem.status == ContentStatus.IN_PROGRESS
    ).first()
    
    if existing_task:
        return TaskResponse(
            website_id=existing_task.id,
            website_url=existing_task.url,
            user_id=current_user.id,
            task_start_time=datetime.utcnow().isoformat()
        )
    
    # Find available content item for the labeler
    # Look for tasks either unassigned or specifically assigned to this user
    content_item = db.query(ContentItem).filter(
        ContentItem.status == ContentStatus.PENDING,
        or_(
            ContentItem.assigned_user_id == None,
            ContentItem.assigned_user_id == current_user.id
        )
    ).first()
    
    if not content_item:
        return TaskResponse(
            message_title="No Tasks",
            message_body="No tasks available at the moment. Please check back later."
        )
    
    # Assign the task if not already assigned
    if content_item.assigned_user_id != current_user.id:
        content_item.assigned_user_id = current_user.id
    content_item.status = ContentStatus.IN_PROGRESS
    db.commit()
    db.refresh(content_item)
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="get_labeler_task",
        resource_type="content_item",
        resource_id=str(content_item.id),
        request=request
    )
    
    return TaskResponse(
        website_id=content_item.id,
        website_url=content_item.url,
        user_id=current_user.id,
        task_start_time=datetime.utcnow().isoformat()
    )

@app.post("/labeler/submit_label", response_model=SuccessResponse)
async def submit_label(
    request: Request,
    website_id: str = Form(...),
    user_id: str = Form(...),
    label_value: str = Form(...),
    tags_str: str = Form(..., alias="tags_str"),
    ai_indicators_str: str = Form(..., alias="ai_indicators_str"),
    human_indicators_str: str = Form(..., alias="human_indicators_str"),
    task_start_time: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Submit a label for a content item via form data
    
    Args:
        request: HTTP request object
        website_id: Content item ID
        user_id: Labeler user ID
        label_value: Label classification (GenAI/Not GenAI)
        tags_str: Custom tags
        ai_indicators_str: AI indicators
        human_indicators_str: Human indicators
        task_start_time: Task start time
        db: Database session
        
    Returns:
        SuccessResponse: Label submission confirmation
    """
    try:
        # Convert IDs to integers
        content_item_id = int(website_id)
        labeler_id = int(user_id)
        
        # Find the content item
        content_item = db.query(ContentItem).filter(
            ContentItem.id == content_item_id,
            ContentItem.assigned_user_id == labeler_id
        ).first()
        
        if not content_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content item not found or not assigned to the specified user"
            )
        
        # Map label value to classification
        if label_value.lower() == "genai":
            classification = LabelClassification.AI_GENERATED
        elif label_value.lower() == "not genai":
            classification = LabelClassification.HUMAN_CREATED
        else:
            classification = LabelClassification.UNCERTAIN
        
        # Parse indicators
        ai_indicators = [ind.strip() for ind in ai_indicators_str.split(',') if ind.strip()]
        human_indicators = [ind.strip() for ind in human_indicators_str.split(',') if ind.strip()]
        custom_tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        
        # Calculate time spent (optional, can be improved)
        time_spent_seconds = 0
        try:
            start_time = datetime.fromisoformat(task_start_time.replace('Z', '+00:00'))
            time_spent_seconds = int((datetime.utcnow() - start_time.replace(tzinfo=None)).total_seconds())
        except:
            pass  # Use default if parsing fails
        
        # Create new label
        new_label = Label(
            content_item_id=content_item_id,
            labeler_id=labeler_id,
            classification=classification,
            confidence_score=80,  # Default confidence
            ai_indicators=json.dumps(ai_indicators),
            human_indicators=json.dumps(human_indicators),
            custom_tags=json.dumps(custom_tags),
            time_spent_seconds=max(0, time_spent_seconds),
            created_at=datetime.utcnow()
        )
        
        db.add(new_label)
        
        # Mark content item as completed
        content_item.status = ContentStatus.COMPLETED
        content_item.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(new_label)
        
        # Log the action
        log_user_action(
            db=db,
            user_id=labeler_id,
            action="submit_label",
            resource_type="label",
            resource_id=str(new_label.id),
            details={
                "content_item_id": content_item_id,
                "classification": classification.value,
                "time_spent": time_spent_seconds
            },
            request=request
        )
        
        return SuccessResponse(message="Label submitted successfully")
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid data format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit label: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
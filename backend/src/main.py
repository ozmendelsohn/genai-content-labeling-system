"""
FastAPI Main Application for GenAI Content Labeling System

This is the main FastAPI application that provides REST API endpoints
for user management, authentication, content management, and labeling.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timedelta
import asyncio

# Import local modules
from database import get_db, engine
from models import User, ContentItem, Label, UserRole, ContentStatus, LabelClassification
from schemas import (
    UserCreate, UserResponse, UserUpdate, UserPasswordUpdate, UserListResponse,
    LoginRequest, LoginResponse, ContentItemCreate, ContentItemResponse, 
    ContentItemUpdate, ContentItemListResponse, LabelCreate, LabelResponse,
    LabelUpdate, LabelListResponse, BulkContentUpload, BulkUploadResponse,
    SystemStats, UserStats, DashboardData, PaginationParams, FilterParams,
    SuccessResponse, ErrorResponse, GeminiAPIKeyRequest, GeminiAPIKeyResponse,
    ContentAnalysisRequest, ContentAnalysisResponse, CompleteAnalysisResult,
    ContentItemCreateWithAI, UserUpdateWithAI, UserResponseWithAI
)
from auth import (
    authenticate_user, create_access_token, get_current_user, get_current_active_user,
    require_admin, require_labeler, require_viewer, update_user_login,
    create_user_session, log_user_action, get_password_hash
)
from ai_service import create_ai_analyzer

# Create FastAPI app
app = FastAPI(
    title="GenAI Content Labeling System",
    description="A comprehensive system for labeling web content as AI-generated or human-created",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://frontend:3001"],
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

# AI Integration Endpoints
@app.post("/ai/api-key", response_model=GeminiAPIKeyResponse)
async def set_gemini_api_key(
    api_key_request: GeminiAPIKeyRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Set and validate Gemini API key for current user
    
    Args:
        api_key_request: API key request data
        request: HTTP request object
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        GeminiAPIKeyResponse: Validation result
    """
    try:
        # Create AI analyzer to validate the API key
        ai_analyzer = create_ai_analyzer(api_key_request.api_key)
        
        if not ai_analyzer:
            return GeminiAPIKeyResponse(
                valid=False,
                message="Failed to initialize AI analyzer with provided API key",
                has_api_key=False
            )
        
        # Validate the API key
        validation_result = ai_analyzer.validate_api_key()
        
        if validation_result["valid"]:
            # Store the API key (in production, this should be encrypted)
            current_user.gemini_api_key = api_key_request.api_key
            db.commit()
            
            # Log the action
            log_user_action(
                db=db,
                user_id=current_user.id,
                action="set_gemini_api_key",
                resource_type="user",
                resource_id=str(current_user.id),
                details={"validation_successful": True},
                request=request
            )
            
            return GeminiAPIKeyResponse(
                valid=True,
                message="API key validated and saved successfully",
                has_api_key=True
            )
        else:
            return GeminiAPIKeyResponse(
                valid=False,
                message=validation_result["message"],
                has_api_key=bool(current_user.gemini_api_key)
            )
    
    except Exception as e:
        return GeminiAPIKeyResponse(
            valid=False,
            message=f"API key validation failed: {str(e)}",
            has_api_key=bool(current_user.gemini_api_key)
        )

@app.get("/ai/api-key/status", response_model=GeminiAPIKeyResponse)
async def get_api_key_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's API key status
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        GeminiAPIKeyResponse: API key status
    """
    has_api_key = bool(current_user.gemini_api_key)
    
    return GeminiAPIKeyResponse(
        valid=has_api_key,
        message="API key configured" if has_api_key else "No API key configured",
        has_api_key=has_api_key
    )

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
        analysis_request: Content analysis request
        request: HTTP request object
        current_user: Current authenticated user with labeler permissions
        db: Database session
        
    Returns:
        ContentAnalysisResponse: Analysis results
    """
    # Check if user has API key configured
    if not current_user.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gemini API key not configured. Please set your API key first."
        )
    
    try:
        # Create AI analyzer
        ai_analyzer = create_ai_analyzer(current_user.gemini_api_key)
        
        if not ai_analyzer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize AI analyzer"
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
        
        # Log the action
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

@app.delete("/ai/api-key")
async def remove_gemini_api_key(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove Gemini API key for current user
    
    Args:
        request: HTTP request object
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        SuccessResponse: Removal confirmation
    """
    current_user.gemini_api_key = None
    db.commit()
    
    # Log the action
    log_user_action(
        db=db,
        user_id=current_user.id,
        action="remove_gemini_api_key",
        resource_type="user",
        resource_id=str(current_user.id),
        request=request
    )
    
    return SuccessResponse(message="Gemini API key removed successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
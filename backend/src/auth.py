"""
Authentication and Authorization Module

This module provides JWT token handling, password verification,
role-based access control, and session management for the GenAI
Content Labeling System.
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserSession, AuditLog, UserRole
from schemas import TokenData

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token security
security = HTTPBearer()

class AuthenticationError(Exception):
    """Custom authentication error"""
    pass

class AuthorizationError(Exception):
    """Custom authorization error"""
    pass

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password from database
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password for storage
    
    Args:
        password: The plain text password
        
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: The data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        str: The encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token
    
    Args:
        data: The data to encode in the token
        
    Returns:
        str: The encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
    """
    Verify and decode a JWT token
    
    Args:
        token: The JWT token to verify
        token_type: The expected token type (access or refresh)
        
    Returns:
        TokenData: The decoded token data or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check token type
        if payload.get("type") != token_type:
            return None
            
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        
        if username is None or user_id is None:
            return None
            
        return TokenData(username=username, user_id=user_id, role=role)
    except JWTError:
        return None

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Authenticate a user with username/email and password
    
    Args:
        db: Database session
        username: Username or email
        password: Plain text password
        
    Returns:
        User: The authenticated user or None if authentication fails
    """
    # Try to find user by username or email
    user = db.query(User).filter(
        (User.username == username.lower()) | (User.email == username.lower())
    ).first()
    
    if not user:
        return None
        
    if not user.is_active:
        return None
        
    if not verify_password(password, user.hashed_password):
        return None
        
    return user

def create_user_session(
    db: Session, 
    user: User, 
    request: Request,
    remember_me: bool = False
) -> UserSession:
    """
    Create a new user session
    
    Args:
        db: Database session
        user: The user to create session for
        request: The HTTP request object
        remember_me: Whether to extend session duration
        
    Returns:
        UserSession: The created session
    """
    # Generate session token
    session_token = secrets.token_urlsafe(32)
    
    # Set expiration
    if remember_me:
        expires_at = datetime.utcnow() + timedelta(days=30)
    else:
        expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Create session
    session = UserSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=expires_at,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500]
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session

def invalidate_user_session(db: Session, session_token: str) -> bool:
    """
    Invalidate a user session
    
    Args:
        db: Database session
        session_token: The session token to invalidate
        
    Returns:
        bool: True if session was invalidated, False if not found
    """
    session = db.query(UserSession).filter(
        UserSession.session_token == session_token,
        UserSession.is_active == True
    ).first()
    
    if session:
        session.is_active = False
        db.commit()
        return True
    
    return False

def log_user_action(
    db: Session,
    user_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
):
    """
    Log a user action for audit purposes
    
    Args:
        db: Database session
        user_id: ID of the user performing the action
        action: The action being performed
        resource_type: Type of resource being acted upon
        resource_id: ID of the specific resource
        details: Additional details about the action
        request: The HTTP request object
    """
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=str(details) if details else None,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500] if request else None
    )
    
    db.add(audit_log)
    db.commit()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token
    
    Args:
        credentials: The HTTP authorization credentials
        db: Database session
        
    Returns:
        User: The current authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token_data = verify_token(credentials.credentials)
        if token_data is None:
            raise credentials_exception
            
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if user is None:
            raise credentials_exception
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )
            
        return user
    except JWTError:
        raise credentials_exception

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user
    
    Args:
        current_user: The current user from token
        
    Returns:
        User: The current active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_role(required_role: UserRole):
    """
    Decorator to require a specific user role
    
    Args:
        required_role: The required user role
        
    Returns:
        Function: The dependency function
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker

def require_roles(required_roles: list[UserRole]):
    """
    Decorator to require one of multiple user roles
    
    Args:
        required_roles: List of acceptable user roles
        
    Returns:
        Function: The dependency function
    """
    async def roles_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return roles_checker

# Convenience role dependencies
require_admin = require_role(UserRole.ADMIN)
require_labeler = require_roles([UserRole.ADMIN, UserRole.LABELER])
require_viewer = require_roles([UserRole.ADMIN, UserRole.LABELER, UserRole.VIEWER])

def update_user_login(db: Session, user: User, request: Request):
    """
    Update user login information
    
    Args:
        db: Database session
        user: The user who logged in
        request: The HTTP request object
    """
    user.last_login = datetime.utcnow()
    user.login_count += 1
    db.commit()
    
    # Log the login action
    log_user_action(
        db=db,
        user_id=user.id,
        action="login",
        resource_type="user",
        resource_id=str(user.id),
        details={"login_count": user.login_count},
        request=request
    )

def check_session_validity(db: Session, session_token: str) -> Optional[UserSession]:
    """
    Check if a session token is valid
    
    Args:
        db: Database session
        session_token: The session token to check
        
    Returns:
        UserSession: The valid session or None if invalid
    """
    session = db.query(UserSession).filter(
        UserSession.session_token == session_token,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).first()
    
    if session:
        # Update last activity
        session.last_activity = datetime.utcnow()
        db.commit()
    
    return session

def cleanup_expired_sessions(db: Session) -> int:
    """
    Clean up expired sessions
    
    Args:
        db: Database session
        
    Returns:
        int: Number of sessions cleaned up
    """
    expired_sessions = db.query(UserSession).filter(
        UserSession.expires_at < datetime.utcnow()
    ).all()
    
    count = len(expired_sessions)
    
    for session in expired_sessions:
        session.is_active = False
    
    db.commit()
    return count 
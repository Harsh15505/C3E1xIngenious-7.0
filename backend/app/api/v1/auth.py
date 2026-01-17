"""
Authentication API Endpoints
User registration, login, profile management
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import logging

from app.models import User
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse, ChangePassword
from app.modules.auth.utils import hash_password, verify_password, create_access_token
from app.modules.auth.middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """
    Register a new user account.
    
    - **email**: Valid email address (unique)
    - **password**: Minimum 8 characters
    - **full_name**: User's full name
    - **role**: 'admin' or 'citizen' (default: citizen)
    """
    try:
        # Check if email already exists
        existing_user = await User.filter(email=user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate role
        if user_data.role not in ["admin", "citizen"]:
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'citizen'")
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Create user
        user = await User.create(
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name,
            role=user_data.role,
            is_active=True,
            is_verified=False  # Can implement email verification later
        )
        
        # Generate JWT token
        access_token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        })
        
        logger.info(f"New user registered: {user.email} (role: {user.role})")
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                is_active=user.is_active,
                is_verified=user.is_verified,
                last_login=user.last_login,
                created_at=user.created_at
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login with email and password.
    
    Returns JWT access token for authenticated requests.
    """
    try:
        # Find user by email
        user = await User.filter(email=credentials.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if account is active
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")
        
        # Update last login
        user.last_login = datetime.utcnow()
        await user.save()
        
        # Generate JWT token
        access_token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        })
        
        logger.info(f"User logged in: {user.email}")
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                is_active=user.is_active,
                is_verified=user.is_verified,
                last_login=user.last_login,
                created_at=user.created_at
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        last_login=current_user.last_login,
        created_at=current_user.created_at
    )


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user)
):
    """
    Change user password.
    
    Requires current password for verification.
    """
    try:
        # Verify current password
        if not verify_password(password_data.current_password, current_user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Hash new password
        new_password_hash = hash_password(password_data.new_password)
        
        # Update password
        current_user.password_hash = new_password_hash
        await current_user.save()
        
        logger.info(f"Password changed for user: {current_user.email}")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Password change failed: {str(e)}")


@router.get("/users")
async def list_users(current_user: User = Depends(get_current_user)):
    """
    List all users (admin only in production - add role check).
    
    For development/testing purposes.
    """
    users = await User.all()
    
    return {
        "total": len(users),
        "users": [
            UserResponse(
                id=str(u.id),
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                is_verified=u.is_verified,
                last_login=u.last_login,
                created_at=u.created_at
            ) for u in users
        ]
    }

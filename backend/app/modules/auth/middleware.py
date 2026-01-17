"""
Authentication Middleware
JWT verification and role-based access control
"""

from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.modules.auth.utils import decode_token
from app.models import User

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify user has admin role"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return current_user


# For optional authentication (public endpoints that can show more data if authenticated)
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(lambda: None)) -> Optional[User]:
    """Get user if token provided, None otherwise (for public endpoints)"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

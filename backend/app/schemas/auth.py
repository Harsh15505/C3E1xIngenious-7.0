"""
Pydantic schemas for Authentication
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters")
    full_name: str
    role: str = Field(default="citizen", description="User role: admin or citizen")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

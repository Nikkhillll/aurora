"""
Pydantic schemas for authentication, authorization, user management, and audit trails.
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field

UserRole = Literal["operator", "admin"]


class UserCreate(BaseModel):
    email: str = Field(..., description="User's official email address")
    name: str = Field(..., min_length=2, description="Full name or station callsign")
    password: str = Field(..., min_length=8, description="Plaintext password (min 8 chars)")
    role: UserRole = Field("operator", description="Requested role (default: operator)")


class UserLogin(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    is_active: bool
    created_at: str
    last_login: Optional[str] = None


class UserUpdateRole(BaseModel):
    role: UserRole = Field(..., description="New role for the user")


class UserUpdateStatus(BaseModel):
    is_active: bool = Field(..., description="True to activate, False to deactivate")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: str
    email: str
    role: UserRole
    exp: int


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    status: str = "success"  # "success" | "failure" | "denied"
    metadata: dict = Field(default_factory=dict)

"""
FastAPI dependencies for authentication, token extraction, and Role-Based Access Control (RBAC).
"""
import logging
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.schemas import UserResponse
from app.auth.security import decode_access_token
from app.auth import store

log = logging.getLogger("aurora.auth.dependencies")

# Bearer token extractor
security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
) -> UserResponse:
    """
    Extract and validate JWT access token from Authorization header.
    Enforces active user status on every request.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = decode_access_token(token)
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as exc:
        log.warning("JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = store.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # CRITICAL: Deny inactive users on every request, even with an unexpired JWT
    if not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an NCPOR administrator.",
        )

    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        last_login=user.get("last_login"),
    )


def require_operator(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """
    Require authenticated user to have at least 'operator' role (or 'admin').
    """
    if current_user.role not in ("operator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Operator privileges required.",
        )
    return current_user


def require_admin(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """
    Require authenticated user to have 'admin' role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: NCPOR Administrator privileges required.",
        )
    return current_user


def validate_ws_token(token: Optional[str]) -> Optional[dict]:
    """
    Validate a JWT token supplied as a WebSocket query parameter (/ws/live?token=...).
    Returns user dict if valid and active, or None/raises error.
    """
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = store.get_user_by_id(user_id)
        if not user or not user.get("is_active"):
            return None
        return user
    except Exception:
        return None

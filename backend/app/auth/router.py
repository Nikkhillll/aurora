"""
FastAPI router for authentication, user management, and administrative audit trails.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import get_current_user, require_admin
from app.auth.schemas import (
    AuditLogEntry,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdateRole,
    UserUpdateStatus,
)
from app.auth.security import create_access_token, hash_password, verify_password
from app.auth import store

log = logging.getLogger("aurora.auth.router")

router = APIRouter(tags=["auth & admin"])


# ─────────────────────────────────────────────────────────────
# Authentication Endpoints
# ─────────────────────────────────────────────────────────────

@router.post(
    "/auth/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new operator account",
)
def signup(payload: UserCreate):
    """
    Public signup. Always creates an account with the 'operator' role.
    Admin roles cannot be provisioned via public signup.
    """
    enforced_role = "operator"

    try:
        pw_hash = hash_password(payload.password)
        created = store.create_user(
            email=payload.email,
            name=payload.name,
            password_hash=pw_hash,
            role=enforced_role,
        )
    except ValueError as exc:
        store.log_audit_event(
            action="SIGNUP_FAILED",
            user_email=payload.email,
            target_type="user",
            status="failure",
            metadata={"reason": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    store.log_audit_event(
        action="USER_SIGNUP",
        user_id=created["id"],
        user_email=created["email"],
        target_type="user",
        target_id=created["id"],
        status="success",
        metadata={"role": enforced_role},
    )

    token = create_access_token(
        user_id=created["id"],
        email=created["email"],
        role=created["role"],
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**created),
    )


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Log in and obtain JWT access token",
)
def login(payload: UserLogin):
    """
    Authenticate with email and password.
    Returns JWT access token with claims and user metadata.
    """
    user = store.get_user_by_email(payload.email)

    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        store.log_audit_event(
            action="LOGIN_FAILED",
            user_email=payload.email,
            status="failure",
            metadata={"reason": "invalid_credentials"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active"):
        store.log_audit_event(
            action="LOGIN_DENIED_INACTIVE",
            user_id=user["id"],
            user_email=user["email"],
            status="denied",
            metadata={"reason": "account_deactivated"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an NCPOR administrator.",
        )

    store.record_login(user["id"])
    store.log_audit_event(
        action="LOGIN_SUCCESS",
        user_id=user["id"],
        user_email=user["email"],
        target_type="user",
        target_id=user["id"],
        status="success",
        metadata={"role": user["role"]},
    )

    token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
    )

    sanitized_user = {k: v for k, v in user.items() if k != "password_hash"}
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**sanitized_user),
    )


@router.get(
    "/auth/me",
    response_model=UserResponse,
    summary="Get profile of currently logged-in user",
)
def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Return the profile and role of the currently authenticated user."""
    return current_user


# ─────────────────────────────────────────────────────────────
# NCPOR Admin Console Endpoints (Admin Only)
# ─────────────────────────────────────────────────────────────

@router.get(
    "/admin/users",
    response_model=List[UserResponse],
    summary="List all registered users (Admin only)",
)
def list_users(admin: UserResponse = Depends(require_admin)):
    """List all accounts across Maitri and Bharati operational stations."""
    users = store.list_users()
    return [UserResponse(**u) for u in users]


@router.post(
    "/admin/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new operator or admin user (Admin only)",
)
def admin_create_user(
    payload: UserCreate,
    admin: UserResponse = Depends(require_admin),
):
    """Admin-provisioned account creation. Can assign either operator or admin roles."""
    try:
        pw_hash = hash_password(payload.password)
        created = store.create_user(
            email=payload.email,
            name=payload.name,
            password_hash=pw_hash,
            role=payload.role,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    store.log_audit_event(
        action="USER_CREATED",
        user_id=admin.id,
        user_email=admin.email,
        target_type="user",
        target_id=created["id"],
        status="success",
        metadata={"created_role": created["role"], "created_email": created["email"]},
    )

    return UserResponse(**created)


@router.patch(
    "/admin/users/{user_id}/status",
    response_model=UserResponse,
    summary="Activate or deactivate a user account (Admin only)",
)
def update_user_status(
    user_id: str,
    payload: UserUpdateStatus,
    admin: UserResponse = Depends(require_admin),
):
    """
    Enable or disable user access.
    Includes safeguards against deactivating the last active administrator.
    """
    try:
        updated = store.update_user_status(user_id, payload.is_active)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ValueError as exc:
        store.log_audit_event(
            action="STATUS_CHANGE_REJECTED",
            user_id=admin.id,
            user_email=admin.email,
            target_type="user",
            target_id=user_id,
            status="denied",
            metadata={"attempted_status": payload.is_active, "reason": str(exc)},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    action = "USER_REACTIVATED" if payload.is_active else "USER_DEACTIVATED"
    store.log_audit_event(
        action=action,
        user_id=admin.id,
        user_email=admin.email,
        target_type="user",
        target_id=user_id,
        status="success",
        metadata={"is_active": payload.is_active, "target_email": updated["email"]},
    )

    return UserResponse(**updated)


@router.patch(
    "/admin/users/{user_id}/role",
    response_model=UserResponse,
    summary="Change a user's role (Admin only)",
)
def update_user_role(
    user_id: str,
    payload: UserUpdateRole,
    admin: UserResponse = Depends(require_admin),
):
    """
    Promote or demote user role.
    Includes safeguards against demoting the last active administrator.
    """
    try:
        updated = store.update_user_role(user_id, payload.role)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ValueError as exc:
        store.log_audit_event(
            action="ROLE_CHANGE_REJECTED",
            user_id=admin.id,
            user_email=admin.email,
            target_type="user",
            target_id=user_id,
            status="denied",
            metadata={"attempted_role": payload.role, "reason": str(exc)},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    store.log_audit_event(
        action="ROLE_CHANGED",
        user_id=admin.id,
        user_email=admin.email,
        target_type="user",
        target_id=user_id,
        status="success",
        metadata={"new_role": payload.role, "target_email": updated["email"]},
    )

    return UserResponse(**updated)


@router.get(
    "/admin/audit-logs",
    response_model=List[AuditLogEntry],
    summary="Retrieve security and administrative audit trail (Admin only)",
)
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action code"),
    user_id: Optional[str] = Query(None, description="Filter by initiating user ID"),
    status: Optional[str] = Query(None, description="Filter by event status (success/failure/denied)"),
    limit: int = Query(100, ge=1, le=1000, description="Max entries to return"),
    admin: UserResponse = Depends(require_admin),
):
    """
    Inspect the audit trail for security-sensitive, operational, and admin operations.
    """
    logs = store.list_audit_logs(
        action=action,
        user_id=user_id,
        status=status,
        limit=limit,
    )
    return [AuditLogEntry(**entry) for entry in logs]

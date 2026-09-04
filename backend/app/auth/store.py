"""
In-memory persistence layer for authentication, user management, and audit logs.

NOTE: This is an in-memory demo repository with a clean repository interface.
In production, this module can be swapped with PostgreSQL / SQLAlchemy
without changing auth route signatures or schemas.
"""
import itertools
import threading
from datetime import datetime, timezone
from typing import Optional

from app.auth.config import (
    DEMO_ADMIN_EMAIL,
    DEMO_ADMIN_NAME,
    DEMO_ADMIN_PASSWORD,
    DEMO_OPERATOR_EMAIL,
    DEMO_OPERATOR_NAME,
    DEMO_OPERATOR_PASSWORD,
)
from app.auth.security import hash_password

_lock = threading.Lock()
_user_id_counter = itertools.count(1)
_audit_id_counter = itertools.count(1)

# user_id -> user_dict
_USERS: dict[str, dict] = {}
# email (lowercase) -> user_id
_USERS_BY_EMAIL: dict[str, str] = {}
# list of audit log entries (newest first)
_AUDIT_LOGS: list[dict] = []


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def seed() -> None:
    """Pre-seed default admin and operator demo accounts if store is empty."""
    with _lock:
        if _USERS:
            return

        # Seed Admin
        admin_id = f"usr_{next(_user_id_counter):03d}"
        _USERS[admin_id] = {
            "id": admin_id,
            "email": DEMO_ADMIN_EMAIL.lower(),
            "name": DEMO_ADMIN_NAME,
            "password_hash": hash_password(DEMO_ADMIN_PASSWORD),
            "role": "admin",
            "is_active": True,
            "created_at": _now_iso(),
            "last_login": None,
        }
        _USERS_BY_EMAIL[DEMO_ADMIN_EMAIL.lower()] = admin_id

        # Seed Operator
        op_id = f"usr_{next(_user_id_counter):03d}"
        _USERS[op_id] = {
            "id": op_id,
            "email": DEMO_OPERATOR_EMAIL.lower(),
            "name": DEMO_OPERATOR_NAME,
            "password_hash": hash_password(DEMO_OPERATOR_PASSWORD),
            "role": "operator",
            "is_active": True,
            "created_at": _now_iso(),
            "last_login": None,
        }
        _USERS_BY_EMAIL[DEMO_OPERATOR_EMAIL.lower()] = op_id

        # Initial seed audit entry
        _AUDIT_LOGS.append({
            "id": f"aud_{next(_audit_id_counter):04d}",
            "timestamp": _now_iso(),
            "user_id": "system",
            "user_email": "system@aurora.ncpor.res.in",
            "action": "SYSTEM_INITIALIZED",
            "target_type": "system",
            "target_id": "aurora_auth",
            "status": "success",
            "metadata": {"seeded_users": 2},
        })


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Retrieve user by ID."""
    with _lock:
        user = _USERS.get(user_id)
        return dict(user) if user else None


def get_user_by_email(email: str) -> Optional[dict]:
    """Retrieve user by email address."""
    with _lock:
        uid = _USERS_BY_EMAIL.get(email.strip().lower())
        if not uid:
            return None
        user = _USERS.get(uid)
        return dict(user) if user else None


def list_users() -> list[dict]:
    """List all registered users (excluding sensitive password hashes)."""
    with _lock:
        return [
            {k: v for k, v in u.items() if k != "password_hash"}
            for u in _USERS.values()
        ]


def create_user(email: str, name: str, password_hash: str, role: str = "operator") -> dict:
    """Create a new user account."""
    normalized_email = email.strip().lower()
    with _lock:
        if normalized_email in _USERS_BY_EMAIL:
            raise ValueError(f"User with email '{normalized_email}' already exists.")

        user_id = f"usr_{next(_user_id_counter):03d}"
        user_record = {
            "id": user_id,
            "email": normalized_email,
            "name": name.strip(),
            "password_hash": password_hash,
            "role": role,
            "is_active": True,
            "created_at": _now_iso(),
            "last_login": None,
        }
        _USERS[user_id] = user_record
        _USERS_BY_EMAIL[normalized_email] = user_id
        return {k: v for k, v in user_record.items() if k != "password_hash"}


def count_active_admins() -> int:
    """Count currently active administrators."""
    return sum(
        1 for u in _USERS.values() if u["role"] == "admin" and u["is_active"]
    )


def update_user_status(user_id: str, is_active: bool) -> dict:
    """Update active/inactive status with safeguard against deactivating the last active admin."""
    with _lock:
        user = _USERS.get(user_id)
        if not user:
            raise KeyError(f"User with id '{user_id}' not found.")

        # Safeguard: cannot deactivate last active admin
        if not is_active and user["role"] == "admin" and user["is_active"]:
            if count_active_admins() <= 1:
                raise ValueError("Operation rejected: Cannot deactivate the final active administrator.")

        user["is_active"] = is_active
        return {k: v for k, v in user.items() if k != "password_hash"}


def update_user_role(user_id: str, new_role: str) -> dict:
    """Update user role with safeguard against demoting the last active admin."""
    with _lock:
        user = _USERS.get(user_id)
        if not user:
            raise KeyError(f"User with id '{user_id}' not found.")

        # Safeguard: cannot demote last active admin to operator
        if new_role != "admin" and user["role"] == "admin" and user["is_active"]:
            if count_active_admins() <= 1:
                raise ValueError("Operation rejected: Cannot demote the final active administrator.")

        user["role"] = new_role
        return {k: v for k, v in user.items() if k != "password_hash"}


def record_login(user_id: str) -> None:
    """Update last_login timestamp upon successful authentication."""
    with _lock:
        user = _USERS.get(user_id)
        if user:
            user["last_login"] = _now_iso()


def log_audit_event(
    action: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    status: str = "success",
    metadata: Optional[dict] = None,
) -> dict:
    """Append a security audit entry to the audit trail."""
    with _lock:
        entry = {
            "id": f"aud_{next(_audit_id_counter):04d}",
            "timestamp": _now_iso(),
            "user_id": user_id,
            "user_email": user_email,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "status": status,
            "metadata": metadata or {},
        }
        _AUDIT_LOGS.insert(0, entry)
        if len(_AUDIT_LOGS) > 1000:
            _AUDIT_LOGS.pop()
        return entry


def list_audit_logs(
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
) -> list[dict]:
    """Retrieve audit log entries with optional filtering."""
    with _lock:
        logs = _AUDIT_LOGS
        if action:
            logs = [l for l in logs if l["action"] == action]
        if user_id:
            logs = [l for l in logs if l["user_id"] == user_id]
        if status:
            logs = [l for l in logs if l["status"] == status]
        return logs[:limit]


# Automatically seed on module import
seed()

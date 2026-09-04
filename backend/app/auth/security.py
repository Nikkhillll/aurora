"""
Security utilities: password hashing, verification, and JWT lifecycle management.
"""
import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

from app.auth.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)

log = logging.getLogger("aurora.auth.security")

# Try to use bcrypt if installed, otherwise robust PBKDF2 HMAC fallback
try:
    import bcrypt

    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False
    log.warning("bcrypt module not found, using PBKDF2-HMAC-SHA256 password hashing fallback.")


def hash_password(plain_password: str) -> str:
    """Hash a password using bcrypt or salted PBKDF2-HMAC-SHA256."""
    if not plain_password:
        raise ValueError("Password cannot be empty")

    if HAS_BCRYPT:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations=100_000,
    )
    return f"pbkdf2:sha256:100000${salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash."""
    if not plain_password or not hashed_password:
        return False

    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$") or hashed_password.startswith("$2y$"):
            if HAS_BCRYPT:
                return bcrypt.checkpw(
                    plain_password.encode("utf-8"), hashed_password.encode("utf-8")
                )
            return False

        if hashed_password.startswith("pbkdf2:sha256:"):
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            salt = parts[1]
            stored_key = parts[2]
            key = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations=100_000,
            )
            return hmac.compare_digest(key.hex(), stored_key)

        return False
    except Exception as exc:
        log.error("Password verification error: %s", exc)
        return False


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    encoded = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded if isinstance(encoded, str) else encoded.decode("utf-8")


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    Raises jwt.ExpiredSignatureError, jwt.InvalidTokenError on failure.
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

"""
Authentication and security configuration.
Loads settings from environment variables with safe defaults for local development.
"""
import logging
import os
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger("aurora.auth.config")

# JWT configuration
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY", "aurora-dev-secret-key-do-not-use-in-production-sih2026"
)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8-hour shift default

# Seed account credentials (loaded from env, with safe dev fallbacks)
DEMO_ADMIN_EMAIL = os.getenv("AURORA_ADMIN_EMAIL", "admin@aurora.ncpor.res.in")
DEMO_ADMIN_NAME = os.getenv("AURORA_ADMIN_NAME", "NCPOR Station Director")
DEMO_ADMIN_PASSWORD = os.getenv("AURORA_ADMIN_PASSWORD", "Admin@Aurora2026!")

DEMO_OPERATOR_EMAIL = os.getenv("AURORA_OPERATOR_EMAIL", "operator@aurora.ncpor.res.in")
DEMO_OPERATOR_NAME = os.getenv("AURORA_OPERATOR_NAME", "Maitri Lead Operator")
DEMO_OPERATOR_PASSWORD = os.getenv("AURORA_OPERATOR_PASSWORD", "Operator@Aurora2026!")

if "aurora-dev-secret" in JWT_SECRET_KEY:
    log.warning(
        "Using default dev JWT_SECRET_KEY. Set JWT_SECRET_KEY environment variable in production."
    )

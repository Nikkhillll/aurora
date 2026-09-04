"""
AURORA Authentication and RBAC module.
"""
from app.auth.dependencies import (
    get_current_user,
    require_admin,
    require_operator,
    validate_ws_token,
)
from app.auth.router import router

# Support both app.include_router(auth_router) and app.include_router(auth_router.router)
router.router = router  # type: ignore

__all__ = [
    "router",
    "get_current_user",
    "require_operator",
    "require_admin",
    "validate_ws_token",
]

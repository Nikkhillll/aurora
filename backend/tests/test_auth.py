"""
Automated unit & integration tests for AURORA Authentication, RBAC, Admin Console, and Audit Logging.

Runs directly with Python's built-in unittest:
    python -m unittest backend/tests/test_auth.py
Or with pytest:
    pytest backend/tests/test_auth.py
"""
import os
import sys
import unittest
from datetime import timedelta
from pathlib import Path

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth.config import (
    DEMO_ADMIN_EMAIL,
    DEMO_ADMIN_PASSWORD,
    DEMO_OPERATOR_EMAIL,
    DEMO_OPERATOR_PASSWORD,
)
from app.auth.router import router as auth_router
from app.auth.security import create_access_token
from app.auth import store

# Setup standalone test FastAPI app
test_app = FastAPI(title="AURORA Auth Test")
test_app.include_router(auth_router)
client = TestClient(test_app)


class TestAuroraAuth(unittest.TestCase):
    def setUp(self):
        # Reset and seed fresh store
        store._USERS.clear()
        store._USERS_BY_EMAIL.clear()
        store._AUDIT_LOGS.clear()
        store.seed()

    def test_01_admin_login_success(self):
        """Valid admin credentials return 200, JWT token, and admin role."""
        resp = client.post(
            "/auth/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["role"], "admin")
        self.assertEqual(data["user"]["email"], DEMO_ADMIN_EMAIL.lower())

    def test_02_operator_login_success(self):
        """Valid operator credentials return 200, JWT token, and operator role."""
        resp = client.post(
            "/auth/login",
            json={"email": DEMO_OPERATOR_EMAIL, "password": DEMO_OPERATOR_PASSWORD},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "operator")

    def test_03_login_invalid_password(self):
        """Incorrect password returns 401 and logs failure."""
        resp = client.post(
            "/auth/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": "WrongPassword123!"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Invalid email or password", resp.json()["detail"])

        # Verify audit log recorded failure
        logs = store.list_audit_logs(action="LOGIN_FAILED")
        self.assertTrue(len(logs) >= 1)

    def test_04_login_nonexistent_user(self):
        """Non-existent email returns 401."""
        resp = client.post(
            "/auth/login",
            json={"email": "nobody@antarctica.res.in", "password": "AnyPassword123!"},
        )
        self.assertEqual(resp.status_code, 401)

    def test_05_public_signup_enforces_operator(self):
        """Public signup creates an operator, even if 'admin' is requested in payload."""
        signup_payload = {
            "email": "field_researcher@aurora.ncpor.res.in",
            "name": "Dr. Ramesh Sharma",
            "password": "SecurePassword2026!",
            "role": "admin",  # Attempting to elevate via public signup
        }
        resp = client.post("/auth/signup", json=signup_payload)
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        # Enforces operator role regardless of payload
        self.assertEqual(data["user"]["role"], "operator")
        self.assertEqual(data["user"]["name"], "Dr. Ramesh Sharma")

    def test_06_get_me_authenticated(self):
        """Authenticated GET /auth/me returns current user profile."""
        login_resp = client.post(
            "/auth/login",
            json={"email": DEMO_OPERATOR_EMAIL, "password": DEMO_OPERATOR_PASSWORD},
        )
        token = login_resp.json()["access_token"]

        me_resp = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["email"], DEMO_OPERATOR_EMAIL.lower())

    def test_07_get_me_unauthenticated(self):
        """Unauthenticated GET /auth/me returns 401."""
        resp = client.get("/auth/me")
        self.assertEqual(resp.status_code, 401)

    def test_08_get_me_expired_token(self):
        """Expired token returns 401."""
        admin = store.get_user_by_email(DEMO_ADMIN_EMAIL)
        expired_token = create_access_token(
            user_id=admin["id"],
            email=admin["email"],
            role=admin["role"],
            expires_delta=timedelta(seconds=-10),  # expired 10 seconds ago
        )
        resp = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("expired", resp.json()["detail"].lower())

    def test_09_inactive_user_denied_on_valid_token(self):
        """
        CRITICAL: Deactivated user must be rejected immediately (403),
        even if holding an unexpired valid JWT.
        """
        # 1. Login as operator to get token
        login_resp = client.post(
            "/auth/login",
            json={"email": DEMO_OPERATOR_EMAIL, "password": DEMO_OPERATOR_PASSWORD},
        )
        token = login_resp.json()["access_token"]
        op_id = login_resp.json()["user"]["id"]

        # 2. Deactivate operator
        store.update_user_status(op_id, is_active=False)

        # 3. Attempt request with previous valid unexpired token
        resp = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("deactivated", resp.json()["detail"].lower())

    def test_10_admin_list_users_rbac(self):
        """Admin can list users; Operator is denied with 403."""
        admin_login = client.post(
            "/auth/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        admin_token = admin_login.json()["access_token"]

        op_login = client.post(
            "/auth/login",
            json={"email": DEMO_OPERATOR_EMAIL, "password": DEMO_OPERATOR_PASSWORD},
        )
        op_token = op_login.json()["access_token"]

        # Admin access -> 200
        admin_resp = client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(admin_resp.status_code, 200)
        self.assertIsInstance(admin_resp.json(), list)
        self.assertTrue(len(admin_resp.json()) >= 2)

        # Operator access -> 403
        op_resp = client.get(
            "/admin/users",
            headers={"Authorization": f"Bearer {op_token}"},
        )
        self.assertEqual(op_resp.status_code, 403)

    def test_11_admin_create_user_with_role(self):
        """Admin can provision a new user with specific role (e.g., admin)."""
        admin_login = client.post(
            "/auth/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        admin_token = admin_login.json()["access_token"]

        payload = {
            "email": "deputy_director@aurora.ncpor.res.in",
            "name": "Deputy Director",
            "password": "AdminPassword2026!",
            "role": "admin",
        }
        resp = client.post(
            "/admin/users",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["role"], "admin")

    def test_12_last_admin_safeguard_deactivation(self):
        """Safeguard: Cannot deactivate the final active administrator."""
        admin_login = client.post(
            "/auth/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        admin_token = admin_login.json()["access_token"]
        admin_id = admin_login.json()["user"]["id"]

        # Only 1 admin currently exists in seeded store
        resp = client.patch(
            f"/admin/users/{admin_id}/status",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Cannot deactivate the final active administrator", resp.json()["detail"])

    def test_13_last_admin_safeguard_demotion(self):
        """Safeguard: Cannot demote the final active administrator to operator."""
        admin_login = client.post(
            "/auth/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        admin_token = admin_login.json()["access_token"]
        admin_id = admin_login.json()["user"]["id"]

        resp = client.patch(
            f"/admin/users/{admin_id}/role",
            json={"role": "operator"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Cannot demote the final active administrator", resp.json()["detail"])

    def test_14_admin_audit_logs_viewer(self):
        """Admin can query audit logs with filters; Operator is denied with 403."""
        admin_login = client.post(
            "/auth/login",
            json={"email": DEMO_ADMIN_EMAIL, "password": DEMO_ADMIN_PASSWORD},
        )
        admin_token = admin_login.json()["access_token"]

        op_login = client.post(
            "/auth/login",
            json={"email": DEMO_OPERATOR_EMAIL, "password": DEMO_OPERATOR_PASSWORD},
        )
        op_token = op_login.json()["access_token"]

        # Admin logs query
        resp = client.get(
            "/admin/audit-logs?limit=50",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(resp.status_code, 200)
        logs = resp.json()
        self.assertIsInstance(logs, list)
        self.assertTrue(len(logs) > 0)
        actions = [l["action"] for l in logs]
        self.assertIn("LOGIN_SUCCESS", actions)

        # Operator denied
        denied_resp = client.get(
            "/admin/audit-logs",
            headers={"Authorization": f"Bearer {op_token}"},
        )
        self.assertEqual(denied_resp.status_code, 403)


if __name__ == "__main__":
    unittest.main()

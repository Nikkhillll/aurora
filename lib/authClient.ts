/**
 * Authentication and Admin API client for AURORA.
 * Handles JWT token storage, user sessions, role checks, and admin operations.
 */

export type UserRole = "operator" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  status: "success" | "failure" | "denied";
  metadata: Record<string, unknown>;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "aurora_jwt_token";
const USER_KEY = "aurora_user_profile";

/**
 * In-memory fallback if localStorage is unavailable (e.g. SSR or strict browser policies).
 */
let memoryToken: string | null = null;
let memoryUser: User | null = null;

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(TOKEN_KEY) || memoryToken;
    } catch {
      return memoryToken;
    }
  }
  return memoryToken;
}

export function setToken(token: string | null): void {
  memoryToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function getStoredUser(): User | null {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as User) : memoryUser;
    } catch {
      return memoryUser;
    }
  }
  return memoryUser;
}

export function setStoredUser(user: User | null): void {
  memoryUser = user;
  if (typeof window !== "undefined") {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function clearSession(): void {
  setToken(null);
  setStoredUser(null);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authenticate with email and password.
 */
export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Authentication failed.");
  }

  const data: TokenResponse = await res.json();
  setToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

/**
 * Register a new operator account (public signup).
 */
export async function signup(
  email: string,
  name: string,
  password: string
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password, role: "operator" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Registration failed.");
  }

  const data: TokenResponse = await res.json();
  setToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

/**
 * Fetch current user profile.
 */
export async function getMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      clearSession();
    }
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Failed to fetch user profile.");
  }

  const user: User = await res.json();
  setStoredUser(user);
  return user;
}

// ─────────────────────────────────────────────────────────────
// Admin API Methods (Admin privileges required)
// ─────────────────────────────────────────────────────────────

/**
 * List all users.
 */
export async function listUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Failed to list users.");
  }

  return res.json();
}

/**
 * Provision a new user (Admin only).
 */
export async function adminCreateUser(payload: CreateUserPayload): Promise<User> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Failed to create user.");
  }

  return res.json();
}

/**
 * Toggle user active status.
 */
export async function updateUserStatus(userId: string, isActive: boolean): Promise<User> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Failed to update user status.");
  }

  return res.json();
}

/**
 * Update user role (operator <-> admin).
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Failed to update user role.");
  }

  return res.json();
}

/**
 * Fetch audit logs.
 */
export async function getAuditLogs(params?: {
  action?: string;
  status?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const query = new URLSearchParams();
  if (params?.action) query.set("action", params.action);
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", params.limit.toString());

  const url = `${API_BASE}/admin/audit-logs${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || "Failed to fetch audit logs.");
  }

  return res.json();
}

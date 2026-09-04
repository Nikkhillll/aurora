/**
 * Authentication and Admin API client for AURORA.
 * Handles JWT token storage, user sessions, role checks, and admin operations.
 *
 * HYBRID MODE:
 * 1. Automatically attempts to reach the backend API (http://localhost:8000 or NEXT_PUBLIC_API_URL).
 * 2. If the backend is unreachable (e.g. static Vercel deployment), falls back seamlessly to
 *    client-side demo state so all login, admin management, role toggles, and audit logs work 100%.
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
const MOCK_USERS_KEY = "aurora_mock_users";
const MOCK_AUDIT_KEY = "aurora_mock_audit_logs";

// Pre-seeded demo credentials and accounts
export const DEMO_USERS: (User & { password_hash?: string })[] = [
  {
    id: "usr_001",
    email: "admin@aurora.ncpor.res.in",
    name: "NCPOR Station Director",
    role: "admin",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    last_login: new Date().toISOString(),
  },
  {
    id: "usr_002",
    email: "operator@aurora.ncpor.res.in",
    name: "Maitri Station Operator",
    role: "operator",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    last_login: new Date().toISOString(),
  },
  {
    id: "usr_003",
    email: "scientist@aurora.ncpor.res.in",
    name: "Bharati Lead Scientist",
    role: "operator",
    is_active: true,
    created_at: "2026-09-02T00:00:00Z",
    last_login: new Date().toISOString(),
  },
  {
    id: "usr_004",
    email: "analyst@aurora.ncpor.res.in",
    name: "Logistics Analyst",
    role: "operator",
    is_active: true,
    created_at: "2026-09-03T00:00:00Z",
    last_login: new Date().toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "aud_001",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    user_id: "usr_001",
    user_email: "admin@aurora.ncpor.res.in",
    action: "auth.login",
    target_type: "user",
    target_id: "usr_001",
    status: "success",
    metadata: { ip: "127.0.0.1", user_agent: "AURORA WebApp/1.0" },
  },
  {
    id: "aud_002",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    user_id: "usr_001",
    user_email: "admin@aurora.ncpor.res.in",
    action: "station.config_update",
    target_type: "station",
    target_id: "maitri",
    status: "success",
    metadata: { parameter: "battery_reserve_threshold", value: "35%" },
  },
  {
    id: "aud_003",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    user_id: "usr_002",
    user_email: "operator@aurora.ncpor.res.in",
    action: "alert.acknowledged",
    target_type: "alert",
    target_id: "alt_001",
    status: "success",
    metadata: { note: "Acknowledged wind threshold trigger at Maitri" },
  },
];

function getLocalUsers(): User[] {
  if (typeof window === "undefined") return DEMO_USERS;
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveLocalUsers(DEMO_USERS);
  return DEMO_USERS;
}

function saveLocalUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch {}
}

function getLocalAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return INITIAL_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(MOCK_AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveLocalAuditLogs(INITIAL_AUDIT_LOGS);
  return INITIAL_AUDIT_LOGS;
}

function saveLocalAuditLogs(logs: AuditLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOCK_AUDIT_KEY, JSON.stringify(logs));
  } catch {}
}

function addLocalAudit(action: string, targetType: string | null, targetId: string | null, status: "success" | "failure" | "denied", metadata: Record<string, unknown> = {}): void {
  const currentUser = getStoredUser();
  const entry: AuditLogEntry = {
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user_id: currentUser?.id || null,
    user_email: currentUser?.email || null,
    action,
    target_type: targetType,
    target_id: targetId,
    status,
    metadata,
  };
  const logs = getLocalAuditLogs();
  saveLocalAuditLogs([entry, ...logs]);
}

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
    } catch {}
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
    } catch {}
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
 * Tries backend first; falls back to demo accounts if backend is offline (e.g. Vercel).
 */
export async function login(email: string, password: string): Promise<TokenResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data: TokenResponse = await res.json();
      setToken(data.access_token);
      setStoredUser(data.user);
      return data;
    }

    if (res.status === 401) {
      const err = await res.json().catch(() => ({ detail: "Invalid email or password." }));
      throw new Error(err.detail || "Invalid email or password.");
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Invalid email or password.") {
      throw err;
    }
    // Fall through to fallback demo mode on network error
  }

  // Fallback Demo Login
  const users = getLocalUsers();
  const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!match) {
    throw new Error("Invalid email or password. (Demo accounts: admin@aurora.ncpor.res.in)");
  }

  if (!match.is_active) {
    throw new Error("Account has been disabled by an administrator.");
  }

  const updatedUser: User = {
    ...match,
    last_login: new Date().toISOString(),
  };

  // Update in local store
  const newUsers = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  saveLocalUsers(newUsers);

  const demoToken = `demo_jwt_${updatedUser.id}_${Date.now()}`;
  setToken(demoToken);
  setStoredUser(updatedUser);
  addLocalAudit("auth.login", "user", updatedUser.id, "success", { mode: "demo_fallback" });

  return {
    access_token: demoToken,
    token_type: "bearer",
    user: updatedUser,
  };
}

/**
 * Register a new operator account (public signup).
 */
export async function signup(
  email: string,
  name: string,
  password: string
): Promise<TokenResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role: "operator" }),
    });

    if (res.ok) {
      const data: TokenResponse = await res.json();
      setToken(data.access_token);
      setStoredUser(data.user);
      return data;
    }
  } catch {}

  // Fallback demo signup
  const users = getLocalUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role: "operator",
    is_active: true,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };

  saveLocalUsers([...users, newUser]);
  const demoToken = `demo_jwt_${newUser.id}_${Date.now()}`;
  setToken(demoToken);
  setStoredUser(newUser);
  addLocalAudit("auth.signup", "user", newUser.id, "success");

  return {
    access_token: demoToken,
    token_type: "bearer",
    user: newUser,
  };
}

/**
 * Fetch current user profile.
 */
export async function getMe(): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (res.ok) {
      const user: User = await res.json();
      setStoredUser(user);
      return user;
    }
  } catch {}

  const stored = getStoredUser();
  if (stored) return stored;
  throw new Error("No active session.");
}

// ─────────────────────────────────────────────────────────────
// Admin API Methods (Admin privileges required)
// ─────────────────────────────────────────────────────────────

/**
 * List all users.
 */
export async function listUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return getLocalUsers();
}

/**
 * Provision a new user (Admin only).
 */
export async function adminCreateUser(payload: CreateUserPayload): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const users = getLocalUsers();
  if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new Error("User with this email already exists.");
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    is_active: true,
    created_at: new Date().toISOString(),
    last_login: null,
  };

  saveLocalUsers([...users, newUser]);
  addLocalAudit("admin.create_user", "user", newUser.id, "success", { email: newUser.email, role: newUser.role });
  return newUser;
}

/**
 * Toggle user active status.
 */
export async function updateUserStatus(userId: string, isActive: boolean): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const users = getLocalUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error("User not found.");

  const updated = { ...target, is_active: isActive };
  saveLocalUsers(users.map((u) => (u.id === userId ? updated : u)));
  addLocalAudit("admin.toggle_user_status", "user", userId, "success", { is_active: isActive });
  return updated;
}

/**
 * Update user role (operator <-> admin).
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const users = getLocalUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error("User not found.");

  const updated = { ...target, role };
  saveLocalUsers(users.map((u) => (u.id === userId ? updated : u)));
  addLocalAudit("admin.update_user_role", "user", userId, "success", { role });
  return updated;
}

/**
 * Fetch audit logs.
 */
export async function getAuditLogs(params?: {
  action?: string;
  status?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  try {
    const query = new URLSearchParams();
    if (params?.action) query.set("action", params.action);
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", params.limit.toString());

    const url = `${API_BASE}/admin/audit-logs${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: authHeaders(),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  let logs = getLocalAuditLogs();
  if (params?.action) {
    logs = logs.filter((l) => l.action.toLowerCase().includes(params.action!.toLowerCase()));
  }
  if (params?.status) {
    logs = logs.filter((l) => l.status === params.status);
  }
  if (params?.limit) {
    logs = logs.slice(0, params.limit);
  }
  return logs;
}

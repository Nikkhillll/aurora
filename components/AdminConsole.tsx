"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  Users,
  FileText,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  X,
} from "lucide-react";
import {
  listUsers,
  adminCreateUser,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
  type User,
  type AuditLogEntry,
  type UserRole,
} from "@/lib/authClient";

interface AdminConsoleProps {
  currentUser?: User | null;
  onClose?: () => void;
}

export default function AdminConsole({ currentUser, onClose }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New User Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("operator");

  // Audit Filters
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const isAdmin = currentUser?.role === "admin";

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listUsers();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuditLogs({
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        limit: 100,
      });
      setAuditLogs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    const loadData = async () => {
      try {
        if (activeTab === "users") {
          const data = await listUsers();
          if (active) setUsers(data);
        } else {
          const data = await getAuditLogs({
            action: actionFilter || undefined,
            status: statusFilter || undefined,
            limit: 100,
          });
          if (active) setAuditLogs(data);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [activeTab, isAdmin, actionFilter, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setActionLoading("create");
      await adminCreateUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setSuccessMsg(`User ${newEmail} created successfully.`);
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("operator");
      await fetchUsersData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setError(null);
    setSuccessMsg(null);
    try {
      setActionLoading(user.id);
      const nextStatus = !user.is_active;
      await updateUserStatus(user.id, nextStatus);
      setSuccessMsg(`User ${user.email} ${nextStatus ? "activated" : "deactivated"}.`);
      await fetchUsersData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user: User) => {
    setError(null);
    setSuccessMsg(null);
    try {
      setActionLoading(user.id);
      const nextRole: UserRole = user.role === "admin" ? "operator" : "admin";
      await updateUserRole(user.id, nextRole);
      setSuccessMsg(`User ${user.email} role updated to ${nextRole.toUpperCase()}.`);
      await fetchUsersData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Role update failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-[12px] border border-border bg-bg-card p-6 text-center flex flex-col items-center gap-3">
        <Lock size={32} className="text-[#F5484F]" />
        <h3 className="text-base font-sans font-medium text-text-primary">
          Access Restricted
        </h3>
        <p className="text-xs text-text-muted max-w-md">
          The NCPOR Admin Console is restricted to authenticated Administrators. Operator accounts do not have permission to view or manage user accounts and system audit trails.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-2 text-xs font-mono px-3 py-1.5 rounded bg-border text-text-primary hover:bg-border/80 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-4 text-text-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <Shield size={20} className="text-[#4CC9F0]" />
          <div>
            <h2 className="text-base font-sans font-medium text-text-primary">
              NCPOR Admin Console
            </h2>
            <p className="text-xs text-text-muted font-mono">
              Role-Based Access Control · Security Audit Trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex bg-border/40 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans rounded-md transition-colors ${
                activeTab === "users"
                  ? "bg-[#4CC9F0]/15 text-[#4CC9F0] font-medium"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Users size={13} />
              User Directory
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans rounded-md transition-colors ${
                activeTab === "audit"
                  ? "bg-[#4CC9F0]/15 text-[#4CC9F0] font-medium"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <FileText size={13} />
              Audit Trail
            </button>
          </div>

          <button
            onClick={activeTab === "users" ? fetchUsersData : fetchAuditData}
            title="Refresh"
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-border/50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-border/50 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="rounded-lg bg-[#F5484F]/10 border border-[#F5484F]/30 p-3 flex items-start gap-2 text-xs text-[#F5484F]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-[#F5484F] hover:opacity-80">
            <X size={12} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 p-3 flex items-start gap-2 text-xs text-[#34D399]">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-[#34D399] hover:opacity-80">
            <X size={12} />
          </button>
        </div>
      )}

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted">
              {users.length} registered accounts
            </span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30 hover:bg-[#4CC9F0]/25 transition-colors"
            >
              <UserPlus size={13} />
              Provision Account
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-border/30 text-text-muted font-mono uppercase tracking-wider text-[11px] border-b border-border">
                <tr>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Last Login</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-border/20 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-text-primary">{u.name}</div>
                      <div className="text-[11px] text-text-muted font-mono">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-medium ${
                          u.role === "admin"
                            ? "bg-[#FFB84D]/15 text-[#FFB84D] border border-[#FFB84D]/30"
                            : "bg-border/60 text-text-muted border border-border"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          u.is_active
                            ? "text-[#34D399] bg-[#34D399]/10"
                            : "text-[#F5484F] bg-[#F5484F]/10"
                        }`}
                      >
                        {u.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-3 text-text-muted font-mono text-[11px]">
                      {u.created_at.slice(0, 10)}
                    </td>
                    <td className="p-3 text-text-muted font-mono text-[11px]">
                      {u.last_login ? u.last_login.slice(11, 19) + " UTC" : "Never"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={actionLoading === u.id}
                          className="px-2 py-1 rounded bg-border/40 hover:bg-border text-text-muted hover:text-text-primary text-[11px] font-mono transition-colors"
                          title="Switch role between Operator and Admin"
                        >
                          {u.role === "admin" ? "Demote" : "Promote"}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoading === u.id}
                          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                            u.is_active
                              ? "bg-[#F5484F]/10 text-[#F5484F] hover:bg-[#F5484F]/20"
                              : "bg-[#34D399]/10 text-[#34D399] hover:bg-[#34D399]/20"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-3">
          {/* Audit Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-bg-base border border-border rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-[#4CC9F0]"
            >
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
              <option value="USER_REACTIVATED">USER_REACTIVATED</option>
              <option value="ROLE_CHANGED">ROLE_CHANGED</option>
              <option value="SYSTEM_INITIALIZED">SYSTEM_INITIALIZED</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-bg-base border border-border rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-[#4CC9F0]"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="denied">Denied</option>
            </select>

            <span className="text-xs font-mono text-text-muted ml-auto">
              {auditLogs.length} events
            </span>
          </div>

          {/* Audit Log Table */}
          <div className="overflow-x-auto rounded-lg border border-border max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-border/30 text-text-muted font-mono uppercase tracking-wider text-[11px] border-b border-border sticky top-0 bg-bg-card">
                <tr>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Target & Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-text-muted">
                      No audit events found for selected filters.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-border/20 transition-colors">
                      <td className="p-3 text-text-muted font-mono whitespace-nowrap">
                        {log.timestamp.replace("T", " ").replace("Z", "")}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[11px] font-semibold text-text-primary">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-text-muted font-mono">
                        {log.user_email || log.user_id || "System"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                            log.status === "success"
                              ? "bg-[#34D399]/15 text-[#34D399]"
                              : log.status === "denied"
                              ? "bg-[#FFB84D]/15 text-[#FFB84D]"
                              : "bg-[#F5484F]/15 text-[#F5484F]"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-text-muted font-mono text-[11px]">
                        {log.target_id && <span className="mr-1.5 text-text-primary">{log.target_id}</span>}
                        {JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[#4CC9F0]" />
                <h3 className="text-sm font-sans font-medium text-text-primary">
                  Provision Antarctic Operations Account
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Full Name / Callsign
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Commander Vikram Roy"
                  className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#4CC9F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="vroy@aurora.ncpor.res.in"
                  className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#4CC9F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Initial Password (Min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#4CC9F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Assigned Operational Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-[#4CC9F0]"
                >
                  <option value="operator">Operator (Maitri / Bharati Dashboard Access)</option>
                  <option value="admin">Administrator (Full Access & User Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-sans text-text-muted hover:text-text-primary hover:bg-border/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="px-4 py-1.5 rounded-lg text-xs font-sans font-medium bg-[#4CC9F0] text-[#0B0F14] hover:bg-[#4CC9F0]/90 transition-colors"
                >
                  {actionLoading === "create" ? "Provisioning..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

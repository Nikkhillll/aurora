"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { login, getStoredUser, clearSession, type User } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState("admin@aurora.ncpor.res.in");
  const [password, setPassword] = useState("Admin@Aurora2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      queueMicrotask(() => setCurrentUser(user));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      setCurrentUser(res.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  const quickFill = (role: "admin" | "operator") => {
    if (role === "admin") {
      setEmail("admin@aurora.ncpor.res.in");
      setPassword("Admin@Aurora2026!");
    } else {
      setEmail("operator@aurora.ncpor.res.in");
      setPassword("Operator@Aurora2026!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-text-primary flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="flex items-center justify-between max-w-md w-full mx-auto">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-[#4CC9F0] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Overview</span>
        </Link>
        <span className="text-[11px] font-mono text-text-muted">
          70.77°S 11.73°E · NCPOR Polar Twin
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="rounded-xl border border-border bg-[#131A24] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
            <div className="p-2.5 rounded-lg border border-[#4CC9F0]/30 bg-[#4CC9F0]/10 text-[#4CC9F0]">
              <Compass size={22} />
            </div>
            <div>
              <h1 className="text-lg font-sans font-bold text-text-primary">
                AURORA Terminal Sign In
              </h1>
              <p className="text-xs font-mono text-text-muted">
                Role-Based Access Control · Antarctic Mission
              </p>
            </div>
          </div>

          {currentUser ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 text-xs text-[#34D399] flex items-center gap-2 font-mono">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>Currently authenticated as {currentUser.name} ({currentUser.role.toUpperCase()})</span>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="flex-1 py-2.5 rounded-lg bg-[#4CC9F0] text-center text-xs font-mono font-bold text-[#0B0F14] hover:bg-[#38BDF8] transition-colors"
                >
                  Enter Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-lg border border-border bg-bg-base text-xs font-mono text-[#F5484F] hover:bg-border/30"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[#F5484F]/10 border border-[#F5484F]/30 text-xs text-[#F5484F] flex items-center gap-2 font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-bg-base px-3 py-2 text-xs font-mono text-text-primary focus:border-[#4CC9F0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Security Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-bg-base px-3 py-2 text-xs font-mono text-text-primary focus:border-[#4CC9F0] focus:outline-none"
                />
              </div>

              {/* Quick Fill Demo Pills */}
              <div className="p-3 rounded-lg bg-bg-base border border-border text-[11px] font-mono text-text-muted space-y-1">
                <span className="text-text-primary block font-semibold">Demo Credentials:</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => quickFill("admin")}
                    className="text-[#4CC9F0] hover:underline"
                  >
                    Admin: admin@aurora.ncpor.res.in
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => quickFill("operator")}
                    className="text-[#34D399] hover:underline"
                  >
                    Operator: operator@aurora.ncpor.res.in
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#4CC9F0] text-center text-xs font-mono font-bold text-[#0B0F14] hover:bg-[#38BDF8] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating Session..." : "Sign In & Launch Dashboard"}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-text-muted">
        Ministry of Earth Sciences (MoES) · NCPOR · SIH 2026
      </footer>
    </div>
  );
}

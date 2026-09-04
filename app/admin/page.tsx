"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import AdminConsole from "@/components/AdminConsole";
import { getStoredUser, type User } from "@/lib/authClient";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const user = getStoredUser();
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-text-muted flex items-center justify-center font-mono text-xs">
        Loading Admin Terminal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-text-primary p-4 sm:p-8 flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-[#4CC9F0] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
          <span className="text-text-muted/40">|</span>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#4CC9F0]" />
            <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
              NCPOR Administrative Console
            </span>
          </div>
        </div>

        <span className="text-xs font-mono text-text-muted">
          Active Operator: {currentUser ? currentUser.name : "Guest"}
        </span>
      </header>

      {/* Main Admin Console */}
      <main className="max-w-6xl w-full mx-auto flex-1 mb-8">
        <AdminConsole currentUser={currentUser} />
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-text-muted pt-4 border-t border-border/60">
        NCPOR Polar Mission Security & User Governance · SIH 2026
      </footer>
    </div>
  );
}

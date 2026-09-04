"use client";

import React, { useState, useEffect } from "react";
import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import ProblemSolution from "./ProblemSolution";
import HowItWorks from "./HowItWorks";
import DomainMonitoring from "./DomainMonitoring";
import DemoScenario from "./DemoScenario";
import StationComparison from "./StationComparison";
import TrustCapabilities from "./TrustCapabilities";
import AskAuroraAssistant from "./AskAuroraAssistant";
import TeamSection from "./TeamSection";
import LandingFooter from "./LandingFooter";
import { getStoredUser, login, clearSession, type User } from "@/lib/authClient";
import { LogIn, X, AlertCircle, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Login form state
  const [email, setEmail] = useState("admin@aurora.ncpor.res.in");
  const [password, setPassword] = useState("Admin@Aurora2026!");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      queueMicrotask(() => setCurrentUser(user));
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const data = await login(email, password);
      setCurrentUser(data.user);
      setShowAuthModal(false);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-text-primary selection:bg-[#4CC9F0]/20 selection:text-[#4CC9F0]">
      {/* Sticky Navigation */}
      <LandingNav
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAssistant={() => setShowAssistantModal(true)}
        currentUser={currentUser}
      />

      {/* Hero Section */}
      <LandingHero />

      {/* Problem -> Solution Section */}
      <ProblemSolution />

      {/* How It Works (5-Stage Operational Loop) */}
      <HowItWorks />

      {/* Four-Domain Monitoring */}
      <DomainMonitoring />

      {/* Interactive SIH Demo Scenario */}
      <DemoScenario />

      {/* Maitri vs Bharati Station Comparison */}
      <StationComparison />

      {/* Mission Readiness & Governance */}
      <TrustCapabilities />

      {/* Ask AURORA Operational Assistant Section */}
      <section id="ask-aurora" className="py-20 border-b border-border bg-[#0B0F14]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 bg-[#4CC9F0]/10 px-3 py-1 rounded-full inline-block mb-3">
              Operational AI Guidance
            </span>
            <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
              Ask AURORA Knowledge Base
            </h2>
            <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
              Instant verified responses to key Antarctic operational, architectural, and SIH evaluation inquiries.
            </p>
          </div>

          <AskAuroraAssistant />
        </div>
      </section>

      {/* Team ASTRA MeridianX */}
      <TeamSection />

      {/* Ready to Launch Banner */}
      <section className="py-16 border-b border-border bg-[#131A24]/60 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-text-primary mb-3">
            Ready to inspect the live Antarctic Digital Twin?
          </h2>
          <p className="text-sm text-text-muted max-w-xl mx-auto mb-8 font-sans">
            Access live environmental telemetry, battery decay projections, structural load cells, and one-click PDF reports.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-[#4CC9F0] px-6 py-3 text-sm font-mono font-bold text-[#0B0F14] hover:bg-[#38BDF8] transition-all shadow-[0_0_20px_rgba(76,201,240,0.3)]"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-5 py-3 text-sm font-mono text-text-primary hover:border-[#4CC9F0]/40 transition-colors cursor-pointer"
            >
              <Shield size={16} className="text-[#4CC9F0]" />
              <span>Operator / Admin Login</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>

            {currentUser ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="p-2.5 rounded-lg border border-[#4CC9F0]/30 bg-[#4CC9F0]/10 text-[#4CC9F0]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-sans font-bold text-text-primary">
                      Authenticated Session
                    </h3>
                    <p className="text-xs font-mono text-text-muted">
                      Role: {currentUser.role.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="text-text-primary font-bold">{currentUser.name}</div>
                  <div className="text-text-muted">{currentUser.email}</div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowAuthModal(false)}
                    className="flex-1 py-2 rounded bg-[#4CC9F0] text-center text-xs font-mono font-bold text-[#0B0F14]"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded border border-border bg-bg-base text-xs font-mono text-[#F5484F] hover:bg-border/30"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="p-2 rounded-lg border border-[#4CC9F0]/30 bg-[#4CC9F0]/10 text-[#4CC9F0]">
                    <LogIn size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-sans font-bold text-text-primary">
                      NCPOR Terminal Sign In
                    </h3>
                    <p className="text-xs font-mono text-text-muted">
                      Role-Based Access Control
                    </p>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-lg bg-[#F5484F]/10 border border-[#F5484F]/30 text-xs text-[#F5484F] flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-text-muted">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg border border-border bg-bg-base px-3 py-2 text-xs font-mono text-text-primary focus:border-[#4CC9F0] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-text-muted">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-lg border border-border bg-bg-base px-3 py-2 text-xs font-mono text-text-primary focus:border-[#4CC9F0] focus:outline-none"
                  />
                </div>

                <div className="text-[11px] font-mono text-text-muted bg-bg-base p-2.5 rounded border border-border">
                  <span className="text-text-primary block font-semibold mb-1">Demo Credentials:</span>
                  Admin: <code className="text-[#4CC9F0]">admin@aurora.ncpor.res.in</code> / <code className="text-text-primary">Admin@Aurora2026!</code><br />
                  Operator: <code className="text-[#4CC9F0]">operator@aurora.ncpor.res.in</code> / <code className="text-text-primary">Operator@Aurora2026!</code>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="flex-1 py-2.5 rounded-lg bg-[#4CC9F0] text-center text-xs font-mono font-bold text-[#0B0F14] hover:bg-[#38BDF8] transition-colors disabled:opacity-50"
                  >
                    {loginLoading ? "Authenticating..." : "Sign In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="px-4 py-2.5 rounded-lg border border-border bg-bg-base text-xs font-mono text-text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Ask AURORA Assistant Modal */}
      {showAssistantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AskAuroraAssistant
              isOpen={true}
              onClose={() => setShowAssistantModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

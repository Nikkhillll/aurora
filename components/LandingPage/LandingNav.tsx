"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Activity,
  MessageSquare,
  LogIn,
  Menu,
  X,
} from "lucide-react";

interface LandingNavProps {
  onOpenAuth?: () => void;
  onOpenAssistant?: () => void;
  currentUser?: { name: string; role: string } | null;
}

export default function LandingNav({
  onOpenAuth,
  onOpenAssistant,
  currentUser,
}: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Platform", href: "#problem-solution" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "4 Domains", href: "#domains" },
    { label: "Simulation", href: "#demo-scenario" },
    { label: "Stations", href: "#stations" },
    { label: "Capabilities", href: "#capabilities" },
    { label: "Team", href: "#team" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#0B0F14]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Station Coordinates */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 text-[#4CC9F0] transition-colors group-hover:border-[#4CC9F0] group-hover:bg-[#4CC9F0]/20">
              <Compass size={20} className="transition-transform group-hover:rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-bold tracking-widest text-text-primary">
                  AURORA
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-[#4CC9F0]/15 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#4CC9F0] border border-[#4CC9F0]/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4CC9F0] animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-text-muted">
                70.77°S 11.73°E · NCPOR Polar Twin
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-mono uppercase tracking-wider text-text-muted hover:text-[#4CC9F0] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs font-mono text-text-primary hover:border-[#4CC9F0]/40 hover:text-[#4CC9F0] transition-colors"
              title="Ask AURORA Operational Knowledge Base"
            >
              <MessageSquare size={13} className="text-[#4CC9F0]" />
              <span>Ask AURORA</span>
            </button>
          )}

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs font-mono text-text-muted hover:text-text-primary hover:bg-border/50 transition-colors"
            >
              <LogIn size={13} />
              <span>{currentUser ? currentUser.name.split(" ")[0] : "Sign In"}</span>
            </button>
          )}

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-[#4CC9F0] bg-[#4CC9F0] px-3.5 py-1.5 text-xs font-mono font-semibold text-[#0B0F14] hover:bg-[#38BDF8] transition-all shadow-[0_0_15px_rgba(76,201,240,0.25)]"
          >
            <Activity size={14} />
            <span>Launch Dashboard</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded bg-[#4CC9F0] px-2.5 py-1 text-[11px] font-mono font-semibold text-[#0B0F14]"
          >
            Launch
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-text-muted hover:text-text-primary"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-bg-card px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-mono uppercase tracking-wider text-text-muted hover:text-[#4CC9F0] py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {onOpenAssistant && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAssistant();
                  }}
                  className="flex items-center justify-center gap-2 rounded border border-border bg-bg-base py-2 text-xs font-mono text-text-primary"
                >
                  <MessageSquare size={14} className="text-[#4CC9F0]" />
                  Ask AURORA Assistant
                </button>
              )}
              {onOpenAuth && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="flex items-center justify-center gap-2 rounded border border-border bg-bg-base py-2 text-xs font-mono text-text-primary"
                >
                  <LogIn size={14} />
                  {currentUser ? `Signed in as ${currentUser.name}` : "Sign In to Terminal"}
                </button>
              )}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded bg-[#4CC9F0] py-2 text-xs font-mono font-bold text-[#0B0F14]"
              >
                <Activity size={14} />
                Launch Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

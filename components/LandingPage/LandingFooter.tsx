"use client";

import React from "react";
import Link from "next/link";
import { Compass, Mail, ExternalLink, Activity } from "lucide-react";

function GithubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-[#0B0F14] text-text-muted py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-border/70">
          {/* Brand & Organization Information */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 text-[#4CC9F0]">
                <Compass size={18} />
              </div>
              <span className="font-mono text-base font-bold tracking-widest text-text-primary">
                AURORA
              </span>
            </div>
            <p className="text-xs font-sans text-text-muted max-w-sm leading-relaxed">
              Antarctic Unified Operations & Risk Analytics. A real-time predictive Digital Twin platform
              developed for Maitri and Bharati polar research stations.
            </p>
            <div className="text-[11px] font-mono text-text-muted/80">
              Ministry of Earth Sciences (MoES) · NCPOR · SIH 2026 (Problem SIH26060)
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 flex flex-col gap-2 font-mono text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider mb-1">
              Platform Navigation
            </span>
            <a href="#problem-solution" className="hover:text-[#4CC9F0] transition-colors">
              Operational Challenge
            </a>
            <a href="#how-it-works" className="hover:text-[#4CC9F0] transition-colors">
              How It Works (5-Stage Loop)
            </a>
            <a href="#domains" className="hover:text-[#4CC9F0] transition-colors">
              Four-Domain Telemetry
            </a>
            <a href="#demo-scenario" className="hover:text-[#4CC9F0] transition-colors">
              What-If Stress Simulation
            </a>
            <a href="#stations" className="hover:text-[#4CC9F0] transition-colors">
              Maitri vs Bharati Comparison
            </a>
            <a href="#team" className="hover:text-[#4CC9F0] transition-colors">
              Team ASTRA MeridianX
            </a>
          </div>

          {/* CTAs and Links */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <span className="font-mono font-bold text-xs text-text-primary uppercase tracking-wider">
              Mission Actions
            </span>
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#4CC9F0] py-2 px-4 text-xs font-mono font-bold text-[#0B0F14] hover:bg-[#38BDF8] transition-colors"
              >
                <Activity size={14} />
                Launch Live Mission Control
              </Link>
              <a
                href="https://github.com/Nikkhillll/aurora"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-card py-2 px-4 text-xs font-mono text-text-primary hover:border-[#4CC9F0]/40 transition-colors"
              >
                <GithubIcon size={14} />
                <span>GitHub Repository</span>
                <ExternalLink size={12} className="text-text-muted" />
              </a>
              <a
                href="mailto:contact@ncpor.res.in?subject=AURORA%20Antarctic%20Digital%20Twin%20Inquiry"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-card py-2 px-4 text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
              >
                <Mail size={14} />
                <span>Contact Expedition Command</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Coordinates & Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-text-muted">
          <div>
            © 2026 Team ASTRA MeridianX · Smart India Hackathon. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Maitri: 70.77°S 11.73°E</span>
            <span>·</span>
            <span>Bharati: 69.40°S 76.19°E</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

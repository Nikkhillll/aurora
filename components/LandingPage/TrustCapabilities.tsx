"use client";

import React from "react";
import {
  Radio,
  Sliders,
  Shield,
  FileText,
  Download,
  WifiOff,
} from "lucide-react";

export default function TrustCapabilities() {
  const capabilities = [
    {
      icon: Radio,
      accent: "#4CC9F0",
      title: "Real-Time WebSocket Stream",
      description:
        "Sub-second event bus streaming environmental spikes, battery voltage dips, and equipment alarms with automatic heartbeat and station-specific channel filtering.",
    },
    {
      icon: Sliders,
      accent: "#FFB84D",
      title: "Physics & ML Digital Twin",
      description:
        "Thermodynamic formulas and machine learning models forecast remaining battery life and fuel burn rate under severe katabatic blizzard conditions.",
    },
    {
      icon: Shield,
      accent: "#38BDF8",
      title: "Role-Based Access Control (RBAC)",
      description:
        "Strict separation between Field Station Operators and NCPOR Mission Directors with secure JWT token lifecycles and administrative account provisioning.",
    },
    {
      icon: FileText,
      accent: "#818CF8",
      title: "Cryptographic Audit Trail",
      description:
        "Every operational action, alert acknowledgment, configuration change, and user role modification is permanently logged with IP and actor metadata.",
    },
    {
      icon: Download,
      accent: "#34D399",
      title: "Executive PDF & CSV Reports",
      description:
        "One-click printable PDF status dossiers formatted specifically for NCPOR leadership, alongside raw CSV telemetry dumps for scientific analysis.",
    },
    {
      icon: WifiOff,
      accent: "#F5A524",
      title: "Hybrid Offline-First Resiliency",
      description:
        "Engineered for intermittent satellite links. Operates autonomously client-side when satellite backhaul is severed without crashes or loss of monitoring.",
    },
  ];

  return (
    <section id="capabilities" className="py-20 border-b border-border bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-1 rounded-full inline-block mb-3">
            Mission Readiness & Governance
          </span>
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
            Built for Extreme Polar Mission Security
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
            Enterprise-grade reliability, security protocols, and operational safety engineered for remote Antarctic infrastructure.
          </p>
        </div>

        {/* 6 Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="rounded-xl border border-border bg-[#131A24] p-6 hover:border-[#4CC9F0]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${cap.accent}15`,
                      color: cap.accent,
                      border: `1px solid ${cap.accent}30`,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <h3 className="font-sans font-bold text-base text-text-primary mb-2">
                    {cap.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-text-muted font-sans leading-relaxed">
                    {cap.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span>Standard Compliant</span>
                  <span style={{ color: cap.accent }}>Verified ✓</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

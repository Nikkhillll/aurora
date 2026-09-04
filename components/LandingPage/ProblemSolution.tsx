"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Cpu,
  FileSpreadsheet,
  ZapOff,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function ProblemSolution() {
  return (
    <section id="problem-solution" className="py-20 border-b border-border bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 bg-[#4CC9F0]/10 px-3 py-1 rounded-full inline-block mb-3">
            Operational Challenge & Paradigm Shift
          </span>
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
            From Isolated Silos to Predictive Command
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
            Antarctic stations operate in the planet&apos;s most hostile environment with sub-zero temperatures,
            ferocious katabatic blizzards, and 6-month winter isolation. Isolated telemetry creates operational blindspots.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left: The Legacy Problem */}
          <div className="rounded-xl border border-[#F5484F]/30 bg-[#131A24] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5484F]/5 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#F5484F]/15 text-[#F5484F] border border-[#F5484F]/30">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-text-primary">
                    Fragmented Station Signals
                  </h3>
                  <span className="text-xs font-mono text-[#F5484F]">The Legacy Reality</span>
                </div>
              </div>

              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                Critical life-support subsystems operate in isolated islands. Operators must manually cross-reference
                environmental sensor logs with battery charge curves and fuel tank gauges during raging blizzards.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-base/60 border border-border">
                  <FileSpreadsheet size={16} className="text-[#F5484F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-mono text-text-primary block">Siloed Subsystems</strong>
                    <span className="text-xs text-text-muted">Weather data, battery logs, and boiler statuses logged in separate formats.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-base/60 border border-border">
                  <Clock size={16} className="text-[#F5484F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-mono text-text-primary block">Delayed Human Triage</strong>
                    <span className="text-xs text-text-muted">Critical power depletion risks discovered hours after blizzard impact begins.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-base/60 border border-border">
                  <ZapOff size={16} className="text-[#F5484F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-mono text-text-primary block">Reactive Emergency Response</strong>
                    <span className="text-xs text-text-muted">No predictive what-if modeling to verify generator fuel autonomy before storms hit.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/80 text-xs font-mono text-text-muted flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5484F]" />
              High operator cognitive load during polar emergencies
            </div>
          </div>

          {/* Right: The AURORA Solution */}
          <div className="rounded-xl border border-[#4CC9F0]/40 bg-[#131A24] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-[0_0_30px_rgba(76,201,240,0.06)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#4CC9F0]/10 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-text-primary">
                    AURORA Unified Digital Twin
                  </h3>
                  <span className="text-xs font-mono text-[#4CC9F0]">Predictive & Autonomous</span>
                </div>
              </div>

              <p className="text-sm text-text-muted mb-6 leading-relaxed">
                AURORA ingests high-frequency telemetry into a real-time InfluxDB and ML pipeline, generating unified
                operational intelligence, what-if stress tests, and automated action protocols.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-base/60 border border-[#4CC9F0]/20">
                  <Layers size={16} className="text-[#4CC9F0] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-mono text-text-primary block">Unified 4-Domain Fusion</strong>
                    <span className="text-xs text-text-muted">Environment, Energy, Infrastructure & Logistics correlated in real time.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-base/60 border border-[#34D399]/20">
                  <Cpu size={16} className="text-[#34D399] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-mono text-text-primary block">Physics & ML Risk Projections</strong>
                    <span className="text-xs text-text-muted">24–72 hour foresight on battery endurance, wind loads, and thermal drops.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-base/60 border border-[#FFB84D]/20">
                  <CheckCircle2 size={16} className="text-[#FFB84D] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs font-mono text-text-primary block">Actionable Triage & Reports</strong>
                    <span className="text-xs text-text-muted">Automated load-shedding guidance, RBAC governance, and instant NCPOR PDF briefs.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/80 text-xs font-mono text-[#34D399] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
              Proactive situational clarity for station directors and polar scientists
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useState } from "react";
import {
  Eye,
  TrendingUp,
  Sliders,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "observe",
      number: "01",
      title: "Observe",
      subtitle: "Continuous Telemetry Ingestion",
      icon: Eye,
      accent: "#4CC9F0",
      description:
        "High-precision IoT sensors stream environmental weather, battery charge states, diesel tank levels, and HVAC structural metrics into high-throughput time-series pipelines.",
      inputs: ["Vaisala AWS (Wind/Temp/Baro)", "Lithium & Lead-Acid BMS", "Fuel Flow Gauges", "Zone Pressure Sensors"],
      output: "Standardized sub-second telemetry snapshot across Maitri & Bharati.",
    },
    {
      id: "predict",
      number: "02",
      title: "Predict",
      subtitle: "Machine Learning Risk Horizon",
      icon: TrendingUp,
      accent: "#38BDF8",
      description:
        "Trained time-series ML models and physical thermodynamic equations project rate-of-change across temperature drops, solar irradiance decay, and power consumption spikes.",
      inputs: ["Rolling 24h Telemetry Buffers", "Antarctic Historical Blizzard Data", "Equipment Degradation Curves"],
      output: "Multi-horizon risk level forecast (Low / Moderate / High / Critical).",
    },
    {
      id: "simulate",
      number: "03",
      title: "Simulate",
      subtitle: "Interactive What-If Stress Testing",
      icon: Sliders,
      accent: "#FFB84D",
      description:
        "Operators test severe scenario stresses (e.g. 100% Blizzard, Tripped Diesel Generator, 30-Day Ship Resupply Delay) to instantly compute battery endurance and mission runway.",
      inputs: ["Scenario Type & Severity (0–100%)", "Active Generation Capacity", "Auxiliary Load Shedding Knobs"],
      output: "Exact remaining battery runtime curve & fuel depletion timeline.",
    },
    {
      id: "recommend",
      number: "04",
      title: "Recommend",
      subtitle: "Automated Operational Protocols",
      icon: ShieldAlert,
      accent: "#F5A524",
      description:
        "The digital twin calculates prioritized life-support conservation steps, such as shedding non-critical scientific labs, pre-heating fuel lines, or locking zone airlocks.",
      inputs: ["Station Safety Margin Matrix", "Subsystem Priority Hierarchy", "Operator Authority Context"],
      output: "Prioritized operational actions & risk mitigation checklists.",
    },
    {
      id: "act",
      number: "05",
      title: "Act & Audit",
      subtitle: "Dispatched Alerts & Governance",
      icon: CheckCircle,
      accent: "#34D399",
      description:
        "Critical alerts are broadcast live via WebSockets, operators acknowledge actions with cryptographic audit tracking, and one-click printable PDF briefs are generated for NCPOR HQ.",
      inputs: ["WebSocket Live Channels", "Role-Based Access Token", "One-Click Report Exporter"],
      output: "Station safety confirmed, auditable security log, and executive briefing PDF.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-b border-border bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] border border-[#34D399]/30 bg-[#34D399]/10 px-3 py-1 rounded-full inline-block mb-3">
            Operational Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
            How AURORA Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
            A seamless 5-step closed-loop operational workflow designed for polar station survival and clarity.
          </p>
        </div>

        {/* Step Progression Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "border-[#4CC9F0] bg-[#131A24] shadow-[0_0_20px_rgba(76,201,240,0.15)]"
                    : "border-border bg-bg-base hover:bg-[#131A24]/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: isSelected ? step.accent : "#8592A3" }}
                  >
                    {step.number}
                  </span>
                  <Icon
                    size={16}
                    style={{ color: isSelected ? step.accent : "#8592A3" }}
                  />
                </div>
                <div className="font-sans font-bold text-sm text-text-primary">{step.title}</div>
                <div className="text-[11px] font-mono text-text-muted truncate">{step.subtitle}</div>

                {isSelected && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: step.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Step Deep Dive Card */}
        {(() => {
          const s = steps[activeStep];
          const Icon = s.icon;
          return (
            <div className="rounded-xl border border-border bg-[#131A24] p-6 sm:p-8 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: Detail */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl border flex items-center justify-center"
                      style={{
                        backgroundColor: `${s.accent}15`,
                        borderColor: `${s.accent}40`,
                        color: s.accent,
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold" style={{ color: s.accent }}>
                          STAGE {s.number} OF 05
                        </span>
                        <span className="text-xs font-mono text-text-muted">· {s.subtitle}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-sans font-bold text-text-primary">
                        {s.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-text-muted leading-relaxed font-sans">
                    {s.description}
                  </p>

                  {/* Inputs and Output Badges */}
                  <div className="pt-4 border-t border-border/70 flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-mono text-text-muted block mb-1.5 uppercase">
                        Sensor / Data Inputs:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {s.inputs.map((inp) => (
                          <span
                            key={inp}
                            className="px-2.5 py-1 rounded bg-bg-base border border-border text-xs font-mono text-text-primary"
                          >
                            {inp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-1">
                      <span className="text-xs font-mono text-text-muted block mb-1.5 uppercase">
                        Operational Output:
                      </span>
                      <div className="p-2.5 rounded bg-bg-base/80 border border-border flex items-center gap-2 text-xs font-mono text-[#34D399]">
                        <CheckCircle size={14} className="shrink-0" />
                        <span>{s.output}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Operational Loop Flow Diagram */}
                <div className="lg:col-span-5 rounded-xl border border-border bg-bg-base p-5 flex flex-col justify-center">
                  <span className="text-xs font-mono uppercase text-text-muted mb-4 block">
                    Closed-Loop Decision Cycle
                  </span>

                  <div className="space-y-2.5 font-mono text-xs">
                    {steps.map((st, i) => (
                      <div
                        key={st.id}
                        onClick={() => setActiveStep(i)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                          i === activeStep
                            ? "border-[#4CC9F0] bg-[#4CC9F0]/10 text-text-primary font-bold shadow-sm"
                            : i < activeStep
                            ? "border-[#34D399]/30 bg-[#34D399]/5 text-text-muted"
                            : "border-border/60 bg-transparent text-text-muted hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
                            style={{
                              backgroundColor: i === activeStep ? st.accent : "rgba(255,255,255,0.05)",
                              color: i === activeStep ? "#0B0F14" : "#8592A3",
                            }}
                          >
                            {st.number}
                          </span>
                          <span>{st.title}</span>
                        </div>
                        {i === activeStep && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4CC9F0]/20 text-[#4CC9F0] uppercase">
                            Active Step
                          </span>
                        )}
                        {i < activeStep && (
                          <span className="text-[10px] text-[#34D399]">✓ Passed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}

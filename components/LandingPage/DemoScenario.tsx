"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function DemoScenario() {
  const [severity, setSeverity] = useState(65);
  const [activeStepIndex, setActiveStepIndex] = useState(2);

  // Derived simulation parameters based on severity slider
  const windSpeed = Math.round(18 + (severity / 100) * 45); // 18kt to 63kt
  const temp = (-28 - (severity / 100) * 16).toFixed(1); // -28C down to -44C
  const solarKw = Math.max(0, (22 - (severity / 100) * 22)).toFixed(1); // 22kW down to 0kW
  const batteryHours = Math.max(4.2, (28 - (severity / 100) * 22)).toFixed(1); // 28h down to 6h
  const risk = severity > 70 ? "CRITICAL" : severity > 40 ? "WARNING" : "NOMINAL";
  const riskColor = severity > 70 ? "#F5484F" : severity > 40 ? "#F5A524" : "#34D399";

  const workflowSteps = [
    {
      step: 1,
      title: "1. Trigger Storm",
      desc: "Simulate sudden 80 km/h katabatic blizzard onset at Maitri Station.",
      status: "Triggered",
      color: "#4CC9F0",
    },
    {
      step: 2,
      title: "2. Telemetry Shifts",
      desc: "Solar PV generation plummets to zero; ambient temp plunges past -40°C.",
      status: "Ingested",
      color: "#38BDF8",
    },
    {
      step: 3,
      title: "3. Risk Rises & Battery Dips",
      desc: `ML engine forecasts battery runtime crashing from 28h to ${batteryHours}h.`,
      status: "Calculated",
      color: "#FFB84D",
    },
    {
      step: 4,
      title: "4. Action Recommended",
      desc: "Triage advises: Shed science lab heating, engage Auxiliary Diesel Gen 2.",
      status: "Actionable",
      color: "#F5A524",
    },
    {
      step: 5,
      title: "5. Export NCPOR Brief",
      desc: "Generate executive 1-page PDF status brief and CSV log for mission command.",
      status: "Export Ready",
      color: "#34D399",
    },
  ];

  return (
    <section id="demo-scenario" className="py-20 border-b border-border bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#F5A524] border border-[#F5A524]/30 bg-[#F5A524]/10 px-3 py-1 rounded-full inline-block mb-3">
            Interactive Digital Twin Walkthrough
          </span>
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
            The SIH Mission Scenario: Polar Blizzard Stress Test
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
            Experience how AURORA detects incoming hazards, recomputes battery longevity, dispatches life-support advisories, and exports executive briefs.
          </p>
        </div>

        {/* Interactive Simulation Console */}
        <div className="rounded-xl border border-border bg-[#131A24] p-6 sm:p-8 shadow-2xl mb-12">
          {/* Top Control Bar: Severity Slider */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#FFB84D]" />
                <h3 className="font-sans text-lg font-bold text-text-primary">
                  Live Storm Severity Control
                </h3>
              </div>
              <p className="text-xs font-mono text-text-muted">
                Drag the severity slider to stress-test station battery autonomy and risk level
              </p>
            </div>

            {/* Slider with visual badge */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <input
                type="range"
                min="0"
                max="100"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full md:w-56 accent-[#4CC9F0] h-2 bg-bg-base rounded-lg cursor-pointer"
              />
              <span className="font-mono text-sm font-bold text-text-primary min-w-[50px]">
                {severity}%
              </span>
              <span
                className="px-2.5 py-1 rounded text-xs font-mono uppercase font-bold"
                style={{
                  backgroundColor: `${riskColor}15`,
                  color: riskColor,
                  border: `1px solid ${riskColor}40`,
                }}
              >
                {risk}
              </span>
            </div>
          </div>

          {/* Dynamic Metric Impact Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-bg-base border border-border">
              <span className="text-xs font-mono text-text-muted block mb-1">Katabatic Wind Speed</span>
              <div className="text-xl font-mono font-bold text-[#38BDF8]">{windSpeed} kt</div>
              <span className="text-[11px] font-mono text-text-muted">Peak Gust: {Math.round(windSpeed * 1.35)} kt</span>
            </div>

            <div className="p-4 rounded-lg bg-bg-base border border-border">
              <span className="text-xs font-mono text-text-muted block mb-1">Surface Temperature</span>
              <div className="text-xl font-mono font-bold text-[#4CC9F0]">{temp}°C</div>
              <span className="text-[11px] font-mono text-text-muted">Windchill: {(Number(temp) - 14).toFixed(1)}°C</span>
            </div>

            <div className="p-4 rounded-lg bg-bg-base border border-border">
              <span className="text-xs font-mono text-text-muted block mb-1">Solar PV Generation</span>
              <div className="text-xl font-mono font-bold text-[#FFB84D]">{solarKw} kW</div>
              <span className="text-[11px] font-mono text-text-muted">Cloud & Snow Obscuration</span>
            </div>

            <div className="p-4 rounded-lg bg-bg-base border border-border">
              <span className="text-xs font-mono text-text-muted block mb-1">Battery Runtime Runway</span>
              <div className="text-xl font-mono font-bold" style={{ color: riskColor }}>
                {batteryHours} Hours
              </div>
              <span className="text-[11px] font-mono text-text-muted">Aux Gen Autostart in 3h</span>
            </div>
          </div>

          {/* Recommended Operational Action Box */}
          <div
            className="p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              backgroundColor: `${riskColor}08`,
              borderColor: `${riskColor}30`,
            }}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="shrink-0 mt-0.5" style={{ color: riskColor }} />
              <div>
                <strong className="text-xs font-mono uppercase block" style={{ color: riskColor }}>
                  {severity > 70
                    ? "Critical Emergency Action Protocol Dispatched"
                    : severity > 40
                    ? "Storm Advisory & Preemptive Load Shedding Active"
                    : "Standard Operational Guard Active"}
                </strong>
                <p className="text-xs text-text-primary mt-0.5">
                  {severity > 70
                    ? "Shed non-critical scientific suites (Zones 4-6). Seal outer airlocks. Engage emergency diesel heating loops."
                    : severity > 40
                    ? "Pre-heat fuel transmission lines. Verify backup battery banks. Restrict outdoor scientist movement."
                    : "Station power balance nominal. Solar PV delivering 65% of required day load."}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono font-bold bg-[#4CC9F0] text-[#0B0F14] hover:bg-[#38BDF8] transition-colors"
            >
              <span>Test in Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* 5-Step Visual Workflow Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {workflowSteps.map((ws, i) => (
            <div
              key={ws.step}
              onClick={() => setActiveStepIndex(i)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeStepIndex === i
                  ? "border-[#4CC9F0] bg-[#131A24] shadow-[0_0_15px_rgba(76,201,240,0.1)]"
                  : "border-border bg-bg-base hover:bg-[#131A24]/60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold" style={{ color: ws.color }}>
                  {ws.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-card text-text-muted">
                  {ws.status}
                </span>
              </div>
              <p className="text-xs text-text-muted font-sans leading-relaxed">{ws.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

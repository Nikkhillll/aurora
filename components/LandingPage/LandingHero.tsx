"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Wind,
  Thermometer,
  BatteryCharging,
  Sliders,
  Radio,
  Flame,
} from "lucide-react";

export default function LandingHero() {
  const [activeStation, setActiveStation] = useState<"maitri" | "bharati">("maitri");
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().slice(0, 19).replace("T", " ") + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const stationData = {
    maitri: {
      name: "Maitri Station",
      coords: "70.77°S, 11.73°E",
      region: "Schirmacher Oasis",
      temp: "-34.5°C",
      wind: "42 kt (78 km/h)",
      pressure: "968 hPa",
      battery: "61%",
      batteryHours: "18.4 hrs",
      solarGen: "14.2 kW",
      fuel: "84 days",
      status: "Operational · Nominal",
      riskLevel: "Low",
      riskColor: "#34D399",
      activeAlerts: 1,
    },
    bharati: {
      name: "Bharati Station",
      coords: "69.40°S, 76.19°E",
      region: "Larsemann Hills",
      temp: "-28.2°C",
      wind: "54 kt (100 km/h)",
      pressure: "958 hPa",
      battery: "48%",
      batteryHours: "12.8 hrs",
      solarGen: "8.6 kW",
      fuel: "112 days",
      status: "Blizzard Warning Active",
      riskLevel: "Moderate",
      riskColor: "#F5A524",
      activeAlerts: 3,
    },
  };

  const curr = stationData[activeStation];

  return (
    <section className="relative overflow-hidden border-b border-border bg-[#0B0F14] pt-12 pb-20 sm:pt-20 sm:pb-28">
      {/* Background Topographic / Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#4CC9F0_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission Statement & Direct Value */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Context Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 px-3 py-1 text-xs font-mono font-medium text-[#4CC9F0]">
                <Radio size={12} className="animate-pulse" />
                SIH 2026 · Problem SIH26060
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-bg-card px-3 py-1 text-xs font-mono text-text-muted">
                Ministry of Earth Sciences (MoES) / NCPOR
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-text-primary leading-[1.1]">
              Command clarity at{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4CC9F0] via-[#38BDF8] to-[#93C5FD]">
                Antarctic distances.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl font-sans">
              A unified Digital Twin platform connecting fragmented environmental, energy,
              infrastructure, and logistics telemetry from <strong className="text-text-primary font-medium">Maitri</strong> and{" "}
              <strong className="text-text-primary font-medium">Bharati</strong> stations into proactive, predictive operational decisions.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-lg border border-[#4CC9F0] bg-[#4CC9F0] px-6 py-3 text-sm font-mono font-bold text-[#0B0F14] hover:bg-[#38BDF8] transition-all shadow-[0_0_20px_rgba(76,201,240,0.3)] group"
              >
                <Activity size={16} />
                <span>Launch Live Dashboard</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#demo-scenario"
                className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-5 py-3 text-sm font-mono text-text-primary hover:border-[#4CC9F0]/40 hover:bg-border/40 transition-colors"
              >
                <Sliders size={15} className="text-[#FFB84D]" />
                <span>Test What-If Simulation</span>
              </a>
            </div>

            {/* Value Props Bullet List */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/60">
              <div>
                <span className="block font-mono text-lg font-bold text-text-primary">24–72h</span>
                <span className="text-xs text-text-muted font-sans">Predictive Risk Horizon</span>
              </div>
              <div>
                <span className="block font-mono text-lg font-bold text-[#4CC9F0]">4 Domains</span>
                <span className="text-xs text-text-muted font-sans">Unified Telemetry Ingestion</span>
              </div>
              <div>
                <span className="block font-mono text-lg font-bold text-[#34D399]">100%</span>
                <span className="text-xs text-text-muted font-sans">Offline-Resilient Architecture</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Command-Center Preview Interactive Card */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border bg-[#131A24] p-5 shadow-2xl relative overflow-hidden">
              {/* Header with live clock & station tabs */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-primary">
                    Command Telemetry
                  </span>
                </div>
                <span className="text-[11px] font-mono text-text-muted">{utcTime || "UTC CLOCK"}</span>
              </div>

              {/* Station Toggle Switch */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-bg-base border border-border mb-4">
                <button
                  onClick={() => setActiveStation("maitri")}
                  className={`py-1.5 text-xs font-mono rounded transition-colors ${
                    activeStation === "maitri"
                      ? "bg-[#4CC9F0]/20 text-[#4CC9F0] border border-[#4CC9F0]/40 font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Maitri (70.77°S)
                </button>
                <button
                  onClick={() => setActiveStation("bharati")}
                  className={`py-1.5 text-xs font-mono rounded transition-colors ${
                    activeStation === "bharati"
                      ? "bg-[#4CC9F0]/20 text-[#4CC9F0] border border-[#4CC9F0]/40 font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  Bharati (69.40°S)
                </button>
              </div>

              {/* Station Overview Banner */}
              <div className="rounded-lg border border-border bg-bg-base/60 p-3.5 mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-sans font-semibold text-text-primary">{curr.name}</h3>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold"
                      style={{
                        backgroundColor: `${curr.riskColor}15`,
                        color: curr.riskColor,
                        border: `1px solid ${curr.riskColor}40`,
                      }}
                    >
                      {curr.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-text-muted">{curr.coords} · {curr.region}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#FFB84D]">{curr.activeAlerts} Active Alert</span>
                </div>
              </div>

              {/* Live Metric Cards Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Temp */}
                <div className="rounded-lg border border-border bg-bg-base p-3">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                    <Thermometer size={13} className="text-[#4CC9F0]" />
                    <span>Ambient Temp</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-[#4CC9F0]">{curr.temp}</div>
                  <span className="text-[10px] font-mono text-text-muted">Baro: {curr.pressure}</span>
                </div>

                {/* Wind */}
                <div className="rounded-lg border border-border bg-bg-base p-3">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                    <Wind size={13} className="text-[#38BDF8]" />
                    <span>Wind Velocity</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-text-primary">{curr.wind}</div>
                  <span className="text-[10px] font-mono text-text-muted">Gust Factor: 1.4x</span>
                </div>

                {/* Battery SOC */}
                <div className="rounded-lg border border-border bg-bg-base p-3">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                    <BatteryCharging size={13} className="text-[#FFB84D]" />
                    <span>Battery Reserve</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-[#FFB84D]">{curr.battery}</div>
                  <span className="text-[10px] font-mono text-text-muted">Remaining: {curr.batteryHours}</span>
                </div>

                {/* Logistics Reserve */}
                <div className="rounded-lg border border-border bg-bg-base p-3">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                    <Flame size={13} className="text-[#34D399]" />
                    <span>Fuel Autonomy</span>
                  </div>
                  <div className="font-mono text-lg font-bold text-[#34D399]">{curr.fuel}</div>
                  <span className="text-[10px] font-mono text-text-muted">Resupply in Nov 2026</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-border/40 py-2.5 text-xs font-mono text-text-primary hover:border-[#4CC9F0]/60 hover:text-[#4CC9F0] transition-colors"
                >
                  <span>Open Full Mission Control Matrix</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

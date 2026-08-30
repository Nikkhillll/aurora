"use client";

import { useState, useEffect } from "react";

import dynamic from "next/dynamic";

import EnvironmentCard from "@/components/EnvironmentCard";
import EnergyCard from "@/components/EnergyCard";
import InfrastructureCard from "@/components/InfrastructureCard";
import LogisticsCard from "@/components/LogisticsCard";
import AlertsPanel from "@/components/AlertsPanel";
import WhatIfSimulator from "@/components/WhatIfSimulator";

// Recharts' ResponsiveContainer measures the real DOM on mount, which
// differs slightly from the server's guess and causes a hydration
// mismatch. Rendering these client-only avoids that entirely.
const TempTrendChart = dynamic(
  () => import("@/components/Charts/TempTrendChart"),
  { ssr: false }
);
const BatteryTrendChart = dynamic(
  () => import("@/components/Charts/BatteryTrendChart"),
  { ssr: false }
);
const SimulationChart = dynamic(
  () => import("@/components/Charts/SimulationChart"),
  { ssr: false }
);

import {
  stations,
  environmentData,
  energyData,
  infrastructureData,
  logisticsData,
  alerts,
  bharatiEnvironmentData,
  bharatiEnergyData,
  bharatiInfrastructureData,
  bharatiLogisticsData,
  bharatiAlerts,
} from "@/data/mockData";

// ── Contour line SVG pattern (topographic background) ──
function ContourPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="contour"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {/* Closed contour rings at varying radii — mimics topo map */}
          <ellipse
            cx="60"
            cy="60"
            rx="50"
            ry="35"
            fill="none"
            stroke="#8592A3"
            strokeWidth="0.5"
            opacity="0.12"
          />
          <ellipse
            cx="60"
            cy="60"
            rx="38"
            ry="25"
            fill="none"
            stroke="#8592A3"
            strokeWidth="0.5"
            opacity="0.10"
          />
          <ellipse
            cx="60"
            cy="60"
            rx="24"
            ry="15"
            fill="none"
            stroke="#8592A3"
            strokeWidth="0.5"
            opacity="0.08"
          />
          <ellipse
            cx="60"
            cy="60"
            rx="10"
            ry="7"
            fill="none"
            stroke="#8592A3"
            strokeWidth="0.5"
            opacity="0.06"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#contour)" />
    </svg>
  );
}

// ── Segmented status strip ──
interface StatusSegment {
  label: string;
  status: "nominal" | "warning" | "critical";
}

function StatusStrip({ segments }: { segments: StatusSegment[] }) {
  const statusColor = {
    nominal: "#34D399",
    warning: "#F5A524",
    critical: "#F5484F",
  };

  return (
    <div className="flex gap-1 w-full">
      {segments.map((seg) => (
        <div key={seg.label} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full h-2.5 rounded-sm"
            style={{ backgroundColor: statusColor[seg.status] }}
          />
          <span className="text-xs text-text-muted font-mono uppercase tracking-wider">
            {seg.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Station data lookup ──
function useStationData(stationId: string) {
  if (stationId === "bharati") {
    return {
      env: bharatiEnvironmentData,
      energy: bharatiEnergyData,
      infra: bharatiInfrastructureData,
      logistics: bharatiLogisticsData,
      stationAlerts: bharatiAlerts,
    };
  }
  return {
    env: environmentData,
    energy: energyData,
    infra: infrastructureData,
    logistics: logisticsData,
    stationAlerts: alerts,
  };
}

function deriveStatus(stationId: string): StatusSegment[] {
  const d = stationId === "bharati"
    ? {
        env: bharatiEnvironmentData,
        energy: bharatiEnergyData,
        infra: bharatiInfrastructureData,
        logistics: bharatiLogisticsData,
      }
    : {
        env: environmentData,
        energy: energyData,
        infra: infrastructureData,
        logistics: logisticsData,
      };

  const envStatus: StatusSegment["status"] =
    d.env.weatherRisk === "High" ? "critical" : d.env.weatherRisk === "Moderate" ? "warning" : "nominal";

  const powerStatus: StatusSegment["status"] =
    d.energy.batteryLevel < 30 ? "critical" : d.energy.batteryLevel < 50 ? "warning" : "nominal";

  const structStatus: StatusSegment["status"] =
    d.infra.zoneStatus === "Critical" ? "critical" : d.infra.zoneStatus === "Warning" ? "warning" : "nominal";

  const logStatus: StatusSegment["status"] =
    d.logistics.fuelLevel < 30 ? "critical" : d.logistics.fuelLevel < 50 ? "warning" : "nominal";

  return [
    { label: "env", status: envStatus },
    { label: "power", status: powerStatus },
    { label: "struct", status: structStatus },
    { label: "logistics", status: logStatus },
  ];
}

// ── Main dashboard page ──
export default function Home() {
  const [activeStation, setActiveStation] = useState("maitri");
  const [utcTime, setUtcTime] = useState("");
  const [severity, setSeverity] = useState(30);

  // Live UTC clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().slice(0, 19).replace("T", " ") + " UTC"
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const station = stations.find((s) => s.id === activeStation) ?? stations[0];
  const { env, energy, infra, logistics, stationAlerts } =
    useStationData(activeStation);
  const statusSegments = deriveStatus(activeStation);
  const stationKey = activeStation === "bharati" ? "bharati" : "maitri";

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Header with contour texture ── */}
      <header className="relative overflow-hidden border-b border-border px-4 py-4 sm:px-6">
        <ContourPattern />

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: station identity */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted font-sans uppercase tracking-widest">
              Aurora — Antarctic operations
            </span>
            <div className="flex items-center gap-3">
              {/* Station toggle buttons */}
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStation(s.id)}
                  className={`font-mono text-base px-2.5 py-1 rounded transition-colors ${
                    activeStation === s.id
                      ? "text-text-primary bg-border/50"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <p className="font-mono text-xl text-text-primary tracking-wide">
              {station.coordinates}
            </p>
          </div>

          {/* Right: UTC timestamp */}
          <div className="text-right">
            <p className="font-mono text-base text-text-muted">{utcTime}</p>
          </div>
        </div>
      </header>

      {/* ── Status strip ── */}
      <div className="px-4 py-3 sm:px-6 border-b border-border">
        <StatusStrip segments={statusSegments} />
      </div>

      {/* ── Instrument cards grid ── */}
      <main className="flex-1 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EnvironmentCard data={env} />
          <EnergyCard data={energy} />
          <InfrastructureCard data={infra} />
          <LogisticsCard data={logistics} />
        </div>

        {/* ── Trend / history section ── */}
        <section className="mt-6">
          <h3 className="text-sm text-text-muted font-sans uppercase tracking-widest mb-3">
            Trend history
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TempTrendChart station={stationKey} />
            <BatteryTrendChart station={stationKey} />
          </div>
        </section>

        {/* ── Alerts & simulator ── */}
        <section className="mt-6">
          <h3 className="text-sm text-text-muted font-sans uppercase tracking-widest mb-3">
            Alerts & simulation
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AlertsPanel alerts={stationAlerts} />
            <WhatIfSimulator onSeverityChange={setSeverity} />
          </div>
          <div className="mt-4">
            <SimulationChart severity={severity} station={stationKey} />
          </div>
        </section>
      </main>
    </div>
  );
}
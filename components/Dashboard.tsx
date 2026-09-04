"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import EnvironmentCard from "@/components/EnvironmentCard";
import EnergyCard from "@/components/EnergyCard";
import InfrastructureCard from "@/components/InfrastructureCard";
import LogisticsCard from "@/components/LogisticsCard";
import AlertsPanel from "@/components/AlertsPanel";
import WhatIfSimulator from "@/components/WhatIfSimulator";

import Notifications from "@/components/Notifications";
import AdminConsole from "@/components/AdminConsole";
import { exportSnapshotToCSV, exportSnapshotToPrintableReport } from "@/utils/export";
import { getStoredUser, setStoredUser, login, clearSession, type User } from "@/lib/authClient";
import { Download, Printer, Shield, LogIn, LogOut, X, AlertCircle, ArrowLeft } from "lucide-react";

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

// ── Main dashboard component ──
export default function Dashboard({ initialStation = "maitri" }: { initialStation?: string }) {
  const [activeStation, setActiveStation] = useState(initialStation);
  const [utcTime, setUtcTime] = useState("");
  const [severity, setSeverity] = useState(30);
  const [scenario, setScenario] = useState<"storm" | "equipment_failure" | "resupply_delay">("storm");

  // Auth & Admin State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("admin@aurora.ncpor.res.in");
  const [loginPassword, setLoginPassword] = useState("Admin@Aurora2026!");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Initialize auth on client mount to prevent React hydration mismatch (Error #418)
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      queueMicrotask(() => setCurrentUser(stored));
    } else {
      const defaultAdmin: User = {
        id: "usr_001",
        email: "admin@aurora.ncpor.res.in",
        name: "NCPOR Station Director",
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      setStoredUser(defaultAdmin);
      queueMicrotask(() => setCurrentUser(defaultAdmin));
    }
  }, []);

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

  const handleExportCSV = () => {
    exportSnapshotToCSV(
      {
        station_id: activeStation,
        timestamp: new Date().toISOString(),
        environment: {
          temperature_c: env.temperature,
          wind_speed_ms: env.wind,
          pressure_hpa: env.pressure,
          visibility_km: 10,
          status: env.weatherRisk.toLowerCase(),
        },
        energy: {
          battery_level_pct: energy.batteryLevel,
          generation_kw: energy.solarGeneration + energy.windGeneration,
          consumption_kw: 12,
          projected_hours_remaining: 24,
          status: "nominal",
        },
        infrastructure: {
          equipment_health_pct: infra.equipmentHealth,
          building_condition: infra.buildingCondition,
          zones: [],
          status: infra.zoneStatus.toLowerCase(),
        },
        logistics: {
          fuel_level_pct: logistics.fuelLevel,
          supplies_level_pct: logistics.foodSupplies,
          spare_parts_count: logistics.spareParts,
          next_resupply: logistics.resupplyWindow,
          status: "nominal",
        },
      },
      station.name
    );
  };

  const handleExportPDF = () => {
    exportSnapshotToPrintableReport(
      {
        station_id: activeStation,
        timestamp: new Date().toISOString(),
        environment: {
          temperature_c: env.temperature,
          wind_speed_ms: env.wind,
          pressure_hpa: env.pressure,
          visibility_km: 10,
          status: env.weatherRisk.toLowerCase(),
        },
        energy: {
          battery_level_pct: energy.batteryLevel,
          generation_kw: energy.solarGeneration + energy.windGeneration,
          consumption_kw: 12,
          projected_hours_remaining: 24,
          status: "nominal",
        },
        infrastructure: {
          equipment_health_pct: infra.equipmentHealth,
          building_condition: infra.buildingCondition,
          zones: [],
          status: infra.zoneStatus.toLowerCase(),
        },
        logistics: {
          fuel_level_pct: logistics.fuelLevel,
          supplies_level_pct: logistics.foodSupplies,
          spare_parts_count: logistics.spareParts,
          next_resupply: logistics.resupplyWindow,
          status: "nominal",
        },
      },
      station.name
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      setCurrentUser(res.user);
      setShowLoginModal(false);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setShowAdmin(false);
  };

  const quickDemoLogin = (role: "admin" | "operator") => {
    if (role === "admin") {
      setLoginEmail("admin@aurora.ncpor.res.in");
      setLoginPassword("Admin@Aurora2026!");
    } else {
      setLoginEmail("operator@aurora.ncpor.res.in");
      setLoginPassword("Operator@Aurora2026!");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F14] text-text-primary min-h-screen">
      {/* ── Header with contour texture ── */}
      <header className="relative overflow-hidden border-b border-border px-4 py-4 sm:px-6 bg-[#0B0F14]/90">
        <ContourPattern />

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: station identity & Overview link */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-[#4CC9F0] transition-colors"
                title="Return to AURORA Landing Page"
              >
                <ArrowLeft size={13} />
                <span>Overview</span>
              </Link>
              <span className="text-text-muted/40">|</span>
              <span className="text-xs text-text-muted font-sans uppercase tracking-widest">
                Aurora — Antarctic operations
              </span>
            </div>

            <div className="flex items-center gap-3 mt-0.5">
              {/* Station toggle buttons */}
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStation(s.id)}
                  className={`font-mono text-base px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeStation === s.id
                      ? "text-text-primary bg-border/50 border border-[#4CC9F0]/30"
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

          {/* Right: Controls & UTC timestamp */}
          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            {/* Snapshot Export Buttons */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-border bg-bg-card hover:bg-border/50 text-text-primary transition-colors cursor-pointer"
              title="Export CSV Telemetry Snapshot"
            >
              <Download size={13} />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-border bg-bg-card hover:bg-border/50 text-text-primary transition-colors cursor-pointer"
              title="Generate Printable PDF Report"
            >
              <Printer size={13} />
              PDF
            </button>

            {/* Notifications Tray */}
            <Notifications stationId={activeStation} />

            {/* Admin Console Toggle (if Admin) */}
            {currentUser?.role === "admin" && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  showAdmin
                    ? "border-[#4CC9F0] bg-[#4CC9F0]/20 text-[#4CC9F0]"
                    : "border-[#4CC9F0]/40 bg-[#4CC9F0]/10 text-[#4CC9F0] hover:bg-[#4CC9F0]/20"
                }`}
                title="Toggle NCPOR Admin Console"
              >
                <Shield size={13} />
                Admin
              </button>
            )}

            {/* User Session / Sign In / Logout Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs font-mono text-text-muted bg-border/40 px-2 py-1 rounded border border-border">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                  {currentUser.role === "admin" ? "NCPOR ADMIN" : "OPERATOR"}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1 text-text-muted hover:text-[#F5484F] transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-border bg-bg-card hover:bg-border/50 text-text-primary transition-colors cursor-pointer"
              >
                <LogIn size={13} />
                Sign In
              </button>
            )}

            {/* Live UTC Clock */}
            <span className="font-mono text-xs text-text-muted tracking-wider">
              {utcTime || "UTC CLOCK"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Admin Console (Slide-down if toggled) ── */}
      {showAdmin && (
        <div className="px-4 py-4 sm:px-6 border-b border-border bg-bg-card/50">
          <AdminConsole
            currentUser={currentUser}
            onClose={() => setShowAdmin(false)}
          />
        </div>
      )}

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-5 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-[#4CC9F0]" />
              <h3 className="font-sans font-medium text-sm text-text-primary">
                NCPOR Terminal Authentication
              </h3>
            </div>
            <p className="text-xs text-text-muted mb-4 font-mono">
              Sign in with your Polar Station credentials
            </p>

            {loginError && (
              <div className="mb-3 rounded bg-[#F5484F]/10 border border-[#F5484F]/30 p-2 text-xs text-[#F5484F] flex items-center gap-1.5 font-mono">
                <AlertCircle size={12} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full rounded border border-border bg-bg-base px-2.5 py-1.5 text-xs font-mono text-text-primary focus:border-[#4CC9F0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full rounded border border-border bg-bg-base px-2.5 py-1.5 text-xs font-mono text-text-primary focus:border-[#4CC9F0] focus:outline-none"
                />
              </div>

              {/* Quick Fill Pills */}
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-text-muted">
                <span>Demo fill:</span>
                <button
                  type="button"
                  onClick={() => quickDemoLogin("admin")}
                  className="underline hover:text-[#4CC9F0]"
                >
                  Admin
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => quickDemoLogin("operator")}
                  className="underline hover:text-[#4CC9F0]"
                >
                  Operator
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 rounded bg-[#4CC9F0] py-1.5 text-xs font-mono font-medium text-[#0B0F14] hover:bg-[#38BDF8] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? "Authenticating..." : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="rounded border border-border px-3 py-1.5 text-xs font-mono text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Segmented status strip ── */}
      <div className="border-b border-border px-4 py-2 sm:px-6">
        <StatusStrip segments={statusSegments} />
      </div>

      {/* ── Main content area ── */}
      <main className="flex-1 px-4 py-4 sm:px-6 flex flex-col gap-4">
        {/* ── Primary 4-card operational grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <EnvironmentCard data={env} />
          <EnergyCard data={energy} />
          <InfrastructureCard data={infra} />
          <LogisticsCard data={logistics} />
        </div>

        {/* ── Trend charts & Alerts ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TempTrendChart station={stationKey} />
          <BatteryTrendChart station={stationKey} />
          <div className="md:col-span-2 lg:col-span-1">
            <AlertsPanel
              alerts={stationAlerts}
            />
          </div>
        </div>

        {/* ── What-If Simulator + Projections chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <WhatIfSimulator
              station={stationKey}
              onSeverityChange={setSeverity}
              onScenarioChange={setScenario}
            />
          </div>
          <div className="lg:col-span-2">
            <SimulationChart
              station={stationKey}
              severity={severity}
              scenario={scenario}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

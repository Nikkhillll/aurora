"use client";

import { useState, useEffect } from "react";

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
import { generateAlerts } from "@/lib/alertsClient";
import { Download, Printer, Shield, LogIn, LogOut, User as UserIcon, X, AlertCircle } from "lucide-react";

// PERSON 1: live Infrastructure/Logistics snapshot fetch — added on top of
// Person 6's auth/admin/export work without touching any of it.
import {
  fetchStationSnapshot,
  type StationKey,
  type StationSnapshot,
} from "@/lib/stationClient";
import {
  mapInfrastructure,
  mapLogistics,
} from "@/lib/snapshotClient";

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
  type EnvironmentData,
  type EnergyData,
  type Alert,
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
  const [scenario, setScenario] = useState<"storm" | "equipment_failure" | "resupply_delay">("storm");

  // Auth & Admin State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("admin@aurora.ncpor.res.in");
  const [loginPassword, setLoginPassword] = useState("Admin@Aurora2026!");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Live backend snapshot + alert state
  const [snapshot, setSnapshot] = useState<StationSnapshot | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);

  // Initialize auth on client mount to prevent React hydration mismatch (Error #418)
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      // Intentional: this must run client-side only, after hydration, per
      // the comment above (avoids React Error #418). Not restructuring
      // Person 6's auth bootstrap here — flagging for their review instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUser(stored);
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
      setCurrentUser(defaultAdmin);
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

  // Live station snapshot + ML alert polling.
  // Fetch immediately and then refresh every 5 seconds so the dashboard
  // reflects new telemetry and backend-generated alerts without a refresh.
  useEffect(() => {
    let cancelled = false;

    const loadLiveData = async () => {
      const snap = await fetchStationSnapshot(activeStation as StationKey);

      if (cancelled) return;

      setSnapshot(snap);

      const conditions = snap
        ? {
            station: activeStation as StationKey,
            batteryLevel: snap.energy.battery_level_pct,
            windSpeed: snap.environment.wind_speed_ms * 3.6,
            temperature: snap.environment.temperature_c,
          }
        : {
            station: activeStation as StationKey,
            batteryLevel: activeStation === "bharati"
              ? bharatiEnergyData.batteryLevel
              : energyData.batteryLevel,
            windSpeed: activeStation === "bharati"
              ? bharatiEnvironmentData.wind
              : environmentData.wind,
            temperature: activeStation === "bharati"
              ? bharatiEnvironmentData.temperature
              : environmentData.temperature,
          };

      const result = await generateAlerts(conditions);

      if (!cancelled) {
        setLiveAlerts(result.alerts);
      }
    };

    void loadLiveData();

    const interval = setInterval(() => {
      void loadLiveData();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeStation]);

  // PERSON 1: station switch handler — clears the stale snapshot at the
  // moment of user interaction (event handler), then triggers the effect
  // above via the activeStation state change. Same UX as before (no stale
  // reading briefly shown under the wrong station), just lint-clean.
  const handleStationChange = (id: string) => {
    setSnapshot(null);
    setActiveStation(id);
  };

  const station = stations.find((s) => s.id === activeStation) ?? stations[0];

  const {
    env: mockEnv,
    energy: mockEnergy,
    infra: mockInfra,
    logistics: mockLogistics,
    stationAlerts: mockStationAlerts,
  } = useStationData(activeStation);

  // Use the complete backend snapshot for Environment and Energy when it is
  // available. Keep mock data as a graceful fallback if the API is offline.
  const env: EnvironmentData = snapshot
    ? {
        temperature: snapshot.environment.temperature_c,
        // Backend reports wind in m/s; the existing card expects km/h.
        wind: snapshot.environment.wind_speed_ms * 3.6,
        pressure: snapshot.environment.pressure_hpa,
        weatherRisk:
          snapshot.environment.status === "critical"
            ? "High"
            : snapshot.environment.status === "warning"
              ? "Moderate"
              : "Low",
      }
    : mockEnv;

  const energy: EnergyData = snapshot
    ? {
        solarGeneration: snapshot.energy.generation_kw,
        windGeneration: 0,
        batteryLevel: snapshot.energy.battery_level_pct,
        generatorStatus:
          snapshot.energy.status === "critical"
            ? "Offline"
            : snapshot.energy.status === "warning"
              ? "Standby"
              : "Online",
      }
    : mockEnergy;

  const infra = snapshot ? mapInfrastructure(snapshot) : mockInfra;
  const logistics = snapshot ? mapLogistics(snapshot) : mockLogistics;

  const statusSegments: StatusSegment[] = [
    {
      label: "env",
      status: snapshot
        ? snapshot.environment.status
        : env.weatherRisk === "High"
          ? "critical"
          : env.weatherRisk === "Moderate"
            ? "warning"
            : "nominal",
    },
    {
      label: "power",
      status: snapshot
        ? snapshot.energy.status
        : energy.batteryLevel < 30
          ? "critical"
          : energy.batteryLevel < 50
            ? "warning"
            : "nominal",
    },
    {
      label: "struct",
      status: snapshot
        ? snapshot.infrastructure.status
        : infra.zoneStatus === "Critical"
          ? "critical"
          : infra.zoneStatus === "Warning"
            ? "warning"
            : "nominal",
    },
    {
      label: "logistics",
      status: snapshot
        ? snapshot.logistics.status
        : logistics.fuelLevel < 30
          ? "critical"
          : logistics.fuelLevel < 50
            ? "warning"
            : "nominal",
    },
  ];
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
          visibility_km: snapshot ? snapshot.environment.visibility_km : 10,
          status: snapshot
            ? snapshot.environment.status
            : env.weatherRisk.toLowerCase(),
        },
        energy: {
          battery_level_pct: energy.batteryLevel,
          generation_kw: snapshot
            ? snapshot.energy.generation_kw
            : energy.solarGeneration + energy.windGeneration,
          consumption_kw: snapshot ? snapshot.energy.consumption_kw : 12,
          projected_hours_remaining: snapshot
            ? snapshot.energy.projected_hours_remaining
            : 24,
          status: snapshot ? snapshot.energy.status : "nominal",
        },
        infrastructure: {
          equipment_health_pct: infra.equipmentHealth,
          building_condition: infra.buildingCondition,
          zones: [],
          status: snapshot
            ? snapshot.infrastructure.status
            : infra.zoneStatus.toLowerCase(),
        },
        logistics: {
          fuel_level_pct: logistics.fuelLevel,
          supplies_level_pct: logistics.foodSupplies,
          spare_parts_count: logistics.spareParts,
          next_resupply: logistics.resupplyWindow,
          status: snapshot ? snapshot.logistics.status : "nominal",
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
          visibility_km: snapshot ? snapshot.environment.visibility_km : 10,
          status: snapshot
            ? snapshot.environment.status
            : env.weatherRisk.toLowerCase(),
        },
        energy: {
          battery_level_pct: energy.batteryLevel,
          generation_kw: snapshot
            ? snapshot.energy.generation_kw
            : energy.solarGeneration + energy.windGeneration,
          consumption_kw: snapshot ? snapshot.energy.consumption_kw : 12,
          projected_hours_remaining: snapshot
            ? snapshot.energy.projected_hours_remaining
            : 24,
          status: snapshot ? snapshot.energy.status : "nominal",
        },
        infrastructure: {
          equipment_health_pct: infra.equipmentHealth,
          building_condition: infra.buildingCondition,
          zones: [],
          status: snapshot
            ? snapshot.infrastructure.status
            : infra.zoneStatus.toLowerCase(),
        },
        logistics: {
          fuel_level_pct: logistics.fuelLevel,
          supplies_level_pct: logistics.foodSupplies,
          spare_parts_count: logistics.spareParts,
          next_resupply: logistics.resupplyWindow,
          status: snapshot ? snapshot.logistics.status : "nominal",
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
    <div className="flex-1 flex flex-col">
      {/* ── Header with contour texture ── */}
      <header className="relative overflow-hidden border-b border-border px-4 py-4 sm:px-6">
        <ContourPattern />

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  onClick={() => handleStationChange(s.id)}
                  className={`font-mono text-base px-2.5 py-1 rounded transition-colors cursor-pointer ${
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
              title="Generate Printable Status Report (PDF)"
            >
              <Printer size={13} />
              PDF
            </button>

            {/* Live Real-Time Notifications Tray */}
            <Notifications stationId={activeStation} />

            {/* Admin Console Toggle (if Admin user) */}
            {currentUser?.role === "admin" && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  showAdmin
                    ? "border-[#4CC9F0] bg-[#4CC9F0]/20 text-[#4CC9F0] font-semibold"
                    : "border-[#4CC9F0]/40 bg-[#4CC9F0]/10 text-[#4CC9F0] hover:bg-[#4CC9F0]/20"
                }`}
              >
                <Shield size={13} />
                Admin
              </button>
            )}

            {/* User Account / Login Toggle */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-border/30 border border-border px-2 py-1 rounded text-xs font-mono">
                <span className="text-[#34D399] font-bold">●</span>
                <span className="text-text-primary">{currentUser.name.split(" ")[0]}</span>
                <span className="text-text-muted uppercase text-[10px] bg-border/50 px-1 rounded">
                  {currentUser.role}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="ml-1 text-text-muted hover:text-[#F5484F] transition-colors"
                >
                  <LogOut size={12} />
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

            {/* UTC Clock + live API state */}
            <div className="text-right ml-1">
              <p className="font-mono text-xs text-text-muted">{utcTime}</p>
              <p className={`font-mono text-[10px] uppercase tracking-wider ${
                snapshot ? "text-[#34D399]" : "text-text-muted"
              }`}>
                {snapshot ? "● LIVE" : "○ FALLBACK"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Admin Console Drawer / Modal Section ── */}
      {showAdmin && (
        <div className="px-4 py-4 sm:px-6 border-b border-border bg-bg-base/80 animate-in fade-in slide-in-from-top-3">
          <AdminConsole currentUser={currentUser} onClose={() => setShowAdmin(false)} />
        </div>
      )}

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
            <AlertsPanel alerts={snapshot ? liveAlerts : mockStationAlerts} />
            <WhatIfSimulator
              onSeverityChange={setSeverity}
              onScenarioChange={setScenario}
              station={stationKey}
            />
          </div>
          <div className="mt-4">
            <SimulationChart severity={severity} scenario={scenario} station={stationKey} />
          </div>
        </section>
      </main>

      {/* ── Demo Authentication Modal ── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-[#4CC9F0]" />
                <h3 className="text-sm font-sans font-medium text-text-primary">
                  AURORA Security Access
                </h3>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            {/* One-click demo roles */}
            <div className="flex flex-col gap-1.5 bg-bg-base/60 p-2.5 rounded-lg border border-border">
              <span className="text-[11px] font-mono text-text-muted">Quick SIH Demo Credentials:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => quickDemoLogin("admin")}
                  className="flex-1 py-1 rounded text-xs font-mono bg-[#FFB84D]/15 text-[#FFB84D] border border-[#FFB84D]/30 hover:bg-[#FFB84D]/25 transition-colors"
                >
                  Admin Role
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin("operator")}
                  className="flex-1 py-1 rounded text-xs font-mono bg-border/50 text-text-primary hover:bg-border transition-colors"
                >
                  Operator Role
                </button>
              </div>
            </div>

            {loginError && (
              <div className="rounded-lg bg-[#F5484F]/10 border border-[#F5484F]/30 p-2.5 flex items-start gap-2 text-xs text-[#F5484F]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#4CC9F0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-[#4CC9F0]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-sans text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-sans font-medium bg-[#4CC9F0] text-[#0B0F14] hover:bg-[#4CC9F0]/90 transition-colors"
                >
                  {loginLoading ? "Authenticating..." : "Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

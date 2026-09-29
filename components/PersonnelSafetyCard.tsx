"use client";

import {
  Users,
  UserMinus,
  ThermometerSnowflake,
  Flame,
  ShieldCheck,
  Clock3,
} from "lucide-react";

import {
  personnelSafetyData,
  type PersonnelSafetyData,
} from "@/data/personnelSafety";

import { calculateColdExposure } from "@/lib/coldExposure";

interface PersonnelSafetyCardProps {
  data?: PersonnelSafetyData;
}

export default function PersonnelSafetyCard({
  data = personnelSafetyData,
}: PersonnelSafetyCardProps) {
  const isHeatingFailed = data.heatingStatus === "failed";

  // Calculate cold exposure risk dynamically
  const coldExposure = calculateColdExposure(
    data.temperatureC,
    data.windSpeedKmh
  );

  const riskClass =
    coldExposure.risk === "HIGH"
      ? "text-red-400"
      : coldExposure.risk === "MEDIUM"
        ? "text-amber-400"
        : "text-emerald-400";

  const overallStatus =
  isHeatingFailed || coldExposure.risk === "HIGH"
    ? "CRITICAL"
    : coldExposure.risk === "MEDIUM"
      ? "WARNING"
      : "NOMINAL";

const statusClass =
  overallStatus === "CRITICAL"
    ? "text-red-400"
    : overallStatus === "WARNING"
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted">
            Personnel Safety
          </p>

          <p className={`mt-1 text-sm font-mono ${statusClass}`}>
            {overallStatus === "CRITICAL"
              ? "CRITICAL — Extreme cold exposure"
              : overallStatus === "WARNING"
                ? "WARNING — Elevated cold exposure"
                : "NOMINAL"}
          </p>
        </div>

        <ShieldCheck size={20} className={statusClass} />
      </div>

      {/* Personnel */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-bg-base p-3">
          <Users size={16} className="text-text-muted" />

          <p className="mt-2 text-2xl font-mono text-text-primary">
            {data.totalPersonnel}
          </p>

          <p className="text-xs text-text-muted">
            Total
          </p>
        </div>

        <div className="rounded-lg border border-border bg-bg-base p-3">
          <ShieldCheck size={16} className="text-emerald-400" />

          <p className="mt-2 text-2xl font-mono text-text-primary">
            {data.onSite}
          </p>

          <p className="text-xs text-text-muted">
            On site
          </p>
        </div>

        <div className="rounded-lg border border-border bg-bg-base p-3">
          <UserMinus size={16} className="text-text-muted" />

          <p className="mt-2 text-2xl font-mono text-text-primary">
            {data.onLeave}
          </p>

          <p className="text-xs text-text-muted">
            On leave
          </p>
        </div>
      </div>

      {/* Heating */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-bg-base p-3">
        <div className="flex items-center gap-3">
          <Flame
            size={18}
            className={
              isHeatingFailed ? "text-red-400" : "text-emerald-400"
            }
          />

          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              Heating
            </p>

            <p
              className={`font-mono text-sm ${
                isHeatingFailed ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {isHeatingFailed ? "FAILED" : "ONLINE"}
            </p>
          </div>
        </div>

        {isHeatingFailed && (
          <div className="flex items-center gap-2 text-red-400">
            <Clock3 size={15} />

            <span className="font-mono text-sm">
              {data.safeEvacuationHours}h window
            </span>
          </div>
        )}
      </div>

      {/* Cold exposure */}
      <div className="mt-3 rounded-lg border border-border bg-bg-base p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ThermometerSnowflake
              size={18}
              className="text-sky-400"
            />

            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">
                Cold Exposure
              </p>

              <p className={`font-mono text-sm ${riskClass}`}>
                {coldExposure.risk}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-sm text-text-primary">
              {data.temperatureC}°C
            </p>

            <p className="text-xs text-text-muted">
              {data.windSpeedKmh} km/h wind
            </p>
          </div>
        </div>

        {/* Wind chill */}
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <p className="text-xs text-text-muted">
              Wind chill
            </p>

            <p className="mt-1 font-mono text-sm text-text-primary">
              {coldExposure.windChillC}°C
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-text-muted">
              Exposure duration
            </p>

            <p className="mt-1 font-mono text-sm text-text-primary">
              {data.exposureHours}h
            </p>
          </div>
        </div>
      </div>

      {/* Heating warning */}
      {isHeatingFailed && (
        <div className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 p-3">
          <p className="text-xs uppercase tracking-wider text-red-400">
            Safety action
          </p>

          <p className="mt-1 text-sm text-text-primary">
            Heating failure detected. Safe evacuation window:
            <span className="ml-1 font-mono text-red-400">
              {data.safeEvacuationHours} hours
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
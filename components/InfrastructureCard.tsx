"use client";

import { Building2 } from "lucide-react";
import DialGauge from "./DialGauge";
import type { InfrastructureData } from "@/data/mockData";

// Accent color for this card's domain (slate-blue — infrastructure)
const ACCENT = "#6C8EEF";

const conditionColor: Record<InfrastructureData["buildingCondition"], string> = {
  Good: "#34D399",
  Fair: "#F5A524",
  "Needs Attention": "#F5484F",
};

const zoneColor: Record<InfrastructureData["zoneStatus"], string> = {
  Normal: "#34D399",
  Warning: "#F5A524",
  Critical: "#F5484F",
};

interface InfrastructureCardProps {
  data: InfrastructureData;
  loading?: boolean;
  error?: string | null;
}

export default function InfrastructureCard({
  data,
  loading = false,
  error = null,
}: InfrastructureCardProps) {
  if (loading) {
    return (
      <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Building2 size={18} style={{ color: ACCENT }} />
          <h2 className="text-base text-text-muted font-sans">Infrastructure</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-12">
          <span className="text-sm font-mono text-text-muted animate-pulse">
            Loading infrastructure telemetry...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Building2 size={18} style={{ color: ACCENT }} />
          <h2 className="text-base text-text-muted font-sans">Infrastructure</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-12">
          <span className="text-sm font-mono text-status-critical">
            {error}
          </span>
        </div>
      </div>
    );
  }

  const currentConditionColor = conditionColor[data.buildingCondition] ?? "#8592A3";
  const currentZoneColor = zoneColor[data.zoneStatus] ?? "#8592A3";

  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <Building2 size={18} style={{ color: ACCENT }} />
        <h2 className="text-base text-text-muted font-sans">Infrastructure</h2>
      </div>

      {/* Dial gauges row */}
      <div className="flex items-center justify-around gap-4">
        <DialGauge
          value={data.equipmentHealth}
          min={0}
          max={100}
          unit="%"
          label="Equipment health"
          color={ACCENT}
        />
        <DialGauge
          value={data.sensorStatus}
          min={0}
          max={100}
          unit="%"
          label="Sensors online"
          color={ACCENT}
        />
      </div>

      {/* Status readouts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Building condition */}
        <div>
          <p className="text-sm text-text-muted font-sans mb-1">
            Building condition
          </p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-medium"
            style={{
              color: currentConditionColor,
              backgroundColor: `${currentConditionColor}14`,
              border: `1px solid ${currentConditionColor}30`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: currentConditionColor }}
            />
            {data.buildingCondition}
          </span>
        </div>

        {/* Zone status */}
        <div>
          <p className="text-sm text-text-muted font-sans mb-1">
            Zone status
          </p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-medium"
            style={{
              color: currentZoneColor,
              backgroundColor: `${currentZoneColor}14`,
              border: `1px solid ${currentZoneColor}30`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: currentZoneColor }}
            />
            {data.zoneStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

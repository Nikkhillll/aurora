"use client";

import { Building2, Activity, Radio, ShieldCheck } from "lucide-react";
import type { InfrastructureData } from "@/data/mockData";

// Accent color for this card's domain
const ACCENT = "#6C8EEF"; // slate-blue — infrastructure

const conditionColor = {
  Good: "#34D399",
  Fair: "#F5A524",
  "Needs Attention": "#F5484F",
} as const;

const zoneColor = {
  Normal: "#34D399",
  Warning: "#F5A524",
  Critical: "#F5484F",
} as const;

interface InfrastructureCardProps {
  data: InfrastructureData;
}

/** Horizontal progress bar — inline, no external deps */
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-sm" style={{ backgroundColor: "#212B38" }}>
      <div
        className="h-full rounded-sm transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function InfrastructureCard({ data }: InfrastructureCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <Building2 size={18} style={{ color: ACCENT }} />
        <h2 className="text-base text-text-muted font-sans">Infrastructure</h2>
      </div>

      {/* Percentage metrics with progress bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* Equipment Health */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Activity size={16} style={{ color: ACCENT }} />
            <p className="text-sm text-text-muted font-sans">Equipment health</p>
          </div>
          <p className="text-xl font-mono" style={{ color: ACCENT }}>
            {data.equipmentHealth}
            <span className="text-sm text-text-muted ml-1">%</span>
          </p>
          <ProgressBar value={data.equipmentHealth} color={ACCENT} />
        </div>

        {/* Sensor Status */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Radio size={16} style={{ color: ACCENT }} />
            <p className="text-sm text-text-muted font-sans">Sensors online</p>
          </div>
          <p className="text-xl font-mono" style={{ color: ACCENT }}>
            {data.sensorStatus}
            <span className="text-sm text-text-muted ml-1">%</span>
          </p>
          <ProgressBar value={data.sensorStatus} color={ACCENT} />
        </div>
      </div>

      {/* Status badges */}
      <div className="grid grid-cols-2 gap-4">
        {/* Building Condition */}
        <div>
          <p className="text-sm text-text-muted font-sans mb-1">Building condition</p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-medium"
            style={{
              color: conditionColor[data.buildingCondition],
              backgroundColor: `${conditionColor[data.buildingCondition]}14`,
              border: `1px solid ${conditionColor[data.buildingCondition]}30`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: conditionColor[data.buildingCondition] }}
            />
            {data.buildingCondition}
          </span>
        </div>

        {/* Zone Status */}
        <div>
          <p className="text-sm text-text-muted font-sans mb-1">Zone status</p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-medium"
            style={{
              color: zoneColor[data.zoneStatus],
              backgroundColor: `${zoneColor[data.zoneStatus]}14`,
              border: `1px solid ${zoneColor[data.zoneStatus]}30`,
            }}
          >
            <ShieldCheck size={14} style={{ color: zoneColor[data.zoneStatus] }} />
            {data.zoneStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

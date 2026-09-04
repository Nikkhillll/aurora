"use client";

import { Truck, Package, CalendarClock } from "lucide-react";
import DialGauge from "./DialGauge";
import type { LogisticsData } from "@/data/mockData";

// Accent color for this card's domain (violet — logistics)
const ACCENT = "#A78BFA";

/** Pick color based on fill level */
function levelColor(pct: number): string {
  if (pct < 30) return "#F5484F"; // critical
  if (pct < 50) return "#F5A524"; // warning
  return ACCENT;                  // nominal — use card accent
}

/** Semantic status for spare parts inventory */
function getSparePartsStatus(count: number): {
  label: string;
  color: string;
} {
  if (count < 15) return { label: "Critical", color: "#F5484F" };
  if (count < 25) return { label: "Low", color: "#F5A524" };
  return { label: "Nominal", color: "#34D399" };
}

interface LogisticsCardProps {
  data?: LogisticsData;
  loading?: boolean;
  error?: string | null;
}

export default function LogisticsCard({
  data,
  loading = false,
  error = null,
}: LogisticsCardProps) {
  if (loading) {
    return (
      <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Truck size={18} style={{ color: ACCENT }} />
          <h2 className="text-base text-text-muted font-sans">Logistics</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-12">
          <span className="text-sm font-mono text-text-muted animate-pulse">
            Loading logistics telemetry...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Truck size={18} style={{ color: ACCENT }} />
          <h2 className="text-base text-text-muted font-sans">Logistics</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-12">
          <span className="text-sm font-mono text-status-critical">
            {error}
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Truck size={18} style={{ color: ACCENT }} />
          <h2 className="text-base text-text-muted font-sans">Logistics</h2>
        </div>
        <div className="flex-1 flex items-center justify-center py-12">
          <span className="text-sm font-mono text-text-muted">
            No logistics data available
          </span>
        </div>
      </div>
    );
  }

  const fuelGaugeColor = levelColor(data.fuelLevel);
  const foodGaugeColor = levelColor(data.foodSupplies);
  const partsStatus = getSparePartsStatus(data.spareParts);

  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <Truck size={18} style={{ color: ACCENT }} />
        <h2 className="text-base text-text-muted font-sans">Logistics</h2>
      </div>

      {/* Dial gauges row */}
      <div className="flex items-center justify-around gap-4">
        <DialGauge
          value={data.fuelLevel}
          min={0}
          max={100}
          unit="%"
          label="Fuel level"
          color={fuelGaugeColor}
        />
        <DialGauge
          value={data.foodSupplies}
          min={0}
          max={100}
          unit="%"
          label="Food supplies"
          color={foodGaugeColor}
        />
      </div>

      {/* Secondary readouts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Spare parts */}
        <div className="flex items-center gap-2">
          <Package size={16} style={{ color: ACCENT }} />
          <div>
            <p className="text-sm text-text-muted font-sans">Spare parts</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-mono" style={{ color: ACCENT }}>
                {data.spareParts}
                <span className="text-sm text-text-muted ml-1">units</span>
              </p>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium"
                style={{
                  color: partsStatus.color,
                  backgroundColor: `${partsStatus.color}14`,
                  border: `1px solid ${partsStatus.color}30`,
                }}
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: partsStatus.color }}
                />
                {partsStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Resupply window */}
        <div className="flex items-center gap-2">
          <CalendarClock size={16} style={{ color: ACCENT }} />
          <div>
            <p className="text-sm text-text-muted font-sans">Resupply window</p>
            <p className="text-sm font-mono text-text-primary mt-0.5">
              {data.resupplyWindow}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

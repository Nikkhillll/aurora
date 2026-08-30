"use client";

import { Truck, Fuel, UtensilsCrossed, Package, CalendarClock } from "lucide-react";
import type { LogisticsData } from "@/data/mockData";

// Accent color for this card's domain
const ACCENT = "#A78BFA"; // violet — logistics

interface LogisticsCardProps {
  data: LogisticsData;
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

/** Pick bar color based on fill level */
function levelColor(pct: number): string {
  if (pct < 30) return "#F5484F"; // critical
  if (pct < 50) return "#F5A524"; // warning
  return ACCENT;                  // nominal — use card accent
}

export default function LogisticsCard({ data }: LogisticsCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <Truck size={18} style={{ color: ACCENT }} />
        <h2 className="text-base text-text-muted font-sans">Logistics</h2>
      </div>

      {/* Percentage metrics with progress bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fuel Level */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Fuel size={16} style={{ color: levelColor(data.fuelLevel) }} />
            <p className="text-sm text-text-muted font-sans">Fuel level</p>
          </div>
          <p className="text-xl font-mono" style={{ color: levelColor(data.fuelLevel) }}>
            {data.fuelLevel}
            <span className="text-sm text-text-muted ml-1">%</span>
          </p>
          <ProgressBar value={data.fuelLevel} color={levelColor(data.fuelLevel)} />
        </div>

        {/* Food Supplies */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={16} style={{ color: levelColor(data.foodSupplies) }} />
            <p className="text-sm text-text-muted font-sans">Food supplies</p>
          </div>
          <p className="text-xl font-mono" style={{ color: levelColor(data.foodSupplies) }}>
            {data.foodSupplies}
            <span className="text-sm text-text-muted ml-1">%</span>
          </p>
          <ProgressBar value={data.foodSupplies} color={levelColor(data.foodSupplies)} />
        </div>
      </div>

      {/* Non-percentage readouts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Spare Parts — count, not percentage */}
        <div className="flex items-center gap-2">
          <Package size={16} style={{ color: ACCENT }} />
          <div>
            <p className="text-sm text-text-muted font-sans">Spare parts</p>
            <p className="text-xl font-mono" style={{ color: ACCENT }}>
              {data.spareParts}
              <span className="text-sm text-text-muted ml-1">units</span>
            </p>
          </div>
        </div>

        {/* Resupply Window */}
        <div className="flex items-center gap-2">
          <CalendarClock size={16} style={{ color: ACCENT }} />
          <div>
            <p className="text-sm text-text-muted font-sans">Resupply window</p>
            <p className="text-sm font-mono text-text-primary">{data.resupplyWindow}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

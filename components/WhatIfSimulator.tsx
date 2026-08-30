"use client";

import { useState } from "react";
import { Sliders, Battery } from "lucide-react";
import { energyData } from "@/data/mockData";

function statusColor(hours: number) {
  if (hours <= 12) return "#F5484F"; // critical
  if (hours <= 24) return "#F5A524"; // warning
  return "#34D399"; // nominal
}

interface WhatIfSimulatorProps {
  /**
   * Optional callback so a parent (e.g. page.tsx) can mirror the slider
   * value and drive other components, like SimulationChart, from it.
   * Component still works fully standalone if this isn't passed.
   */
  onSeverityChange?: (severity: number) => void;
}

export default function WhatIfSimulator({
  onSeverityChange,
}: WhatIfSimulatorProps) {
  const [severity, setSeverity] = useState(30);

  const handleChange = (value: number) => {
    setSeverity(value);
    onSeverityChange?.(value);
  };

  // Baseline: at 0% storm severity, battery drains at a nominal rate
  // giving ~48hrs remaining. Higher severity increases draw multiplier,
  // reducing hours remaining non-linearly.
  const baselineHours = 48;
  const multiplier = 1 + (severity / 100) * 1.8; // 1x -> 2.8x at 100%
  const batteryFactor = energyData.batteryLevel / 61; // scale off current level
  const projectedHours = Math.max(
    1,
    Math.round((baselineHours * batteryFactor) / multiplier)
  );

  const color = statusColor(projectedHours);

  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <Sliders size={18} className="text-text-muted" />
        <h2 className="text-base text-text-muted font-sans">
          What-if simulator
        </h2>
      </div>

      {/* Scenario label */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="storm-severity"
            className="text-sm text-text-muted font-sans"
          >
            Simulate storm severity
          </label>
          <span className="text-sm font-mono text-text-primary">
            {severity}%
          </span>
        </div>

        <input
          id="storm-severity"
          type="range"
          min={0}
          max={100}
          step={1}
          value={severity}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-[#4CC9F0]"
        />

        <div className="flex justify-between text-[11px] font-mono text-text-muted">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Projected impact */}
      <div
        className="flex items-center gap-3 rounded-[8px] p-3"
        style={{
          backgroundColor: `${color}0F`,
          border: `1px solid ${color}30`,
        }}
      >
        <Battery size={20} style={{ color }} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-mono uppercase tracking-wide text-text-muted">
            Projected battery drain
          </span>
          <p className="text-lg font-mono font-medium" style={{ color }}>
            {projectedHours}
            <span className="text-sm text-text-muted ml-1">hrs remaining</span>
          </p>
        </div>
      </div>
    </div>
  );
}
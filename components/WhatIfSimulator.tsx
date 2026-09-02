"use client";

import { useEffect, useState } from "react";
import { Sliders, Battery, Wifi, WifiOff } from "lucide-react";
import { energyData, bharatiEnergyData } from "@/data/mockData";
import {
  runSimulation,
  statusColorForHours,
  type StationKey,
  type SimulationResult,
} from "@/lib/simulationClient";

interface WhatIfSimulatorProps {
  /**
   * Optional callback so a parent (e.g. page.tsx) can mirror the slider
   * value and drive other components, like SimulationChart, from it.
   * Component still works fully standalone if this isn't passed.
   */
  onSeverityChange?: (severity: number) => void;
  station?: StationKey;
}

export default function WhatIfSimulator({
  onSeverityChange,
  station = "maitri",
}: WhatIfSimulatorProps) {
  const [severity, setSeverity] = useState(30);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const stationEnergy = station === "bharati" ? bharatiEnergyData : energyData;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    runSimulation({
      severity,
      station,
      batteryLevel: stationEnergy.batteryLevel,
    }).then((res) => {
      if (!cancelled) {
        setResult(res);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [severity, station, stationEnergy.batteryLevel]);

  const handleChange = (value: number) => {
    setSeverity(value);
    onSeverityChange?.(value);
  };

  const projectedHours = result?.projectedHours ?? 0;
  const color = statusColorForHours(projectedHours);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-text-muted" />
          <h2 className="text-base text-text-muted font-sans">
            What-if simulator
          </h2>
        </div>

        {/* Live/fallback indicator — shows whether this is hitting the
            real backend yet, or still running on local math. Useful for
            the team to see at a glance during integration, harmless to
            leave visible in the final demo too. */}
        {result && (
          <span
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide"
            style={{ color: result.isLive ? "#34D399" : "#8592A3" }}
            title={
              result.isLive
                ? "Connected to live simulation backend"
                : "Backend not connected yet — using local projection"
            }
          >
            {result.isLive ? <Wifi size={11} /> : <WifiOff size={11} />}
            {result.isLive ? "Live" : "Offline mode"}
          </span>
        )}
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
        className="flex items-center gap-3 rounded-lg p-3 transition-opacity"
        style={{
          backgroundColor: `${color}0F`,
          border: `1px solid ${color}30`,
          opacity: loading ? 0.6 : 1,
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
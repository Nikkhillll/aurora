"use client";

import { useEffect, useState } from "react";
import { Sliders, Battery, Wifi, WifiOff, Info } from "lucide-react";
import { energyData, bharatiEnergyData } from "@/data/mockData";
import {
  runSimulation,
  statusColorForRisk,
  type StationKey,
  type Scenario,
  type SimulationResult,
} from "@/lib/simulationClient";

interface WhatIfSimulatorProps {
  onSeverityChange?: (severity: number) => void;
  station?: StationKey;
}

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: "storm", label: "Storm" },
  { value: "equipment_failure", label: "Equipment failure" },
  { value: "resupply_delay", label: "Resupply delay" },
];

export default function WhatIfSimulator({
  onSeverityChange,
  station = "maitri",
}: WhatIfSimulatorProps) {
  const [severity, setSeverity] = useState(30);
  const [scenario, setScenario] = useState<Scenario>("storm");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const stationEnergy = station === "bharati" ? bharatiEnergyData : energyData;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    runSimulation({
      severity,
      scenario,
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
  }, [severity, scenario, station, stationEnergy.batteryLevel]);

  const handleSeverityChange = (value: number) => {
    setSeverity(value);
    onSeverityChange?.(value);
  };

  const projectedHours = result?.projectedHours ?? 0;
  const baselineHours = result?.baselineHours ?? 0;
  const color = statusColorForRisk(result?.riskLevel ?? "low");

  return (
    <div className="rounded-lg border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-text-muted" />
          <h2 className="text-base text-text-muted font-sans">
            What-if simulator
          </h2>
        </div>

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

      {/* Scenario selector */}
      <div className="flex gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.value}
            onClick={() => setScenario(s.value)}
            className="flex-1 rounded-lg px-2 py-1.5 text-xs font-sans transition-colors"
            style={{
              backgroundColor: scenario === s.value ? "#4CC9F015" : "transparent",
              border: `1px solid ${scenario === s.value ? "#4CC9F0" : "#212B38"}`,
              color: scenario === s.value ? "#4CC9F0" : "#8592A3",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Severity slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="storm-severity" className="text-sm text-text-muted font-sans">
            Severity
          </label>
          <span className="text-sm font-mono text-text-primary">{severity}%</span>
        </div>

        <input
          id="storm-severity"
          type="range"
          min={0}
          max={100}
          step={1}
          value={severity}
          onChange={(e) => handleSeverityChange(Number(e.target.value))}
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
            <span className="text-sm text-text-muted ml-1">
              hrs remaining
              {baselineHours > 0 && (
                <span className="text-text-muted"> (baseline {baselineHours}h)</span>
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Narrative — plain-language explanation from the backend */}
      {result?.narrative && (
        <div className="flex items-start gap-2 rounded-lg bg-bg-base/50 p-3">
          <Info size={14} className="text-text-muted mt-0.5 shrink-0" />
          <p className="text-xs text-text-muted font-sans leading-relaxed">
            {result.narrative}
          </p>
        </div>
      )}
    </div>
  );
}
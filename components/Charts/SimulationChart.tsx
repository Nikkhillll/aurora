"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown } from "lucide-react";
import { energyData, bharatiEnergyData, stations } from "@/data/mockData";
import {
  runSimulation,
  statusColorForRisk,
  type Scenario,
} from "@/lib/simulationClient";

interface SimulationChartProps {
  severity?: number;
  scenario?: Scenario;
  station?: "maitri" | "bharati";
}

export default function SimulationChart({
  severity = 30,
  scenario = "storm",
  station = "maitri",
}: SimulationChartProps) {
  const stationEnergy = station === "bharati" ? bharatiEnergyData : energyData;
  const stationName = stations.find((s) => s.id === station)?.name ?? "Maitri";

  const [projectedHours, setProjectedHours] = useState(24);
  const [timeline, setTimeline] = useState<{ hour: number; battery_pct: number }[]>([]);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    runSimulation({
      severity,
      scenario,
      station,
      batteryLevel: stationEnergy.batteryLevel,
    }).then((res) => {
      if (!cancelled) {
        setProjectedHours(res.projectedHours);
        setTimeline(res.timeline);
        setRiskLevel(res.riskLevel);
        setIsLive(res.isLive);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [severity, scenario, station, stationEnergy.batteryLevel]);

  const color = statusColorForRisk(riskLevel);

  // Timeline now comes straight from the backend (or the local fallback,
  // which produces the same shape) — no more separately-calculated
  // baseline/projected lines drifting out of sync with the slider.
  const data = timeline.map((point) => ({
    hour: point.hour,
    battery: point.battery_pct,
  }));

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown size={18} className="text-text-muted" />
          <h3 className="text-base text-text-muted font-sans">
            Projected battery drain
          </h3>
        </div>
        <span className="text-sm font-mono" style={{ color }}>
          {projectedHours}h remaining · {stationName}
          {isLive && <span className="text-status-nominal ml-1">·live</span>}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              unit="h"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={36}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="battery"
              name={`Projected battery (${scenario}, ${severity}%)`}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
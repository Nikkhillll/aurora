"use client";

import { useMemo } from "react";
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

function statusColor(hours: number) {
  if (hours <= 12) return "#F5484F"; // critical
  if (hours <= 24) return "#F5A524"; // warning
  return "#34D399"; // nominal
}

interface SimulationChartProps {
  /**
   * Storm severity 0-100, matching WhatIfSimulator's slider. Same formula
   * as WhatIfSimulator so the chart and its "hrs remaining" readout agree.
   */
  severity?: number;
  station?: "maitri" | "bharati";
}

export default function SimulationChart({
  severity = 30,
  station = "maitri",
}: SimulationChartProps) {
  const stationEnergy = station === "bharati" ? bharatiEnergyData : energyData;
  const stationName =
    stations.find((s) => s.id === station)?.name ?? "Maitri";

  const { data, projectedHours, color } = useMemo(() => {
    const baselineHours = 48;
    const multiplier = 1 + (severity / 100) * 1.8; // 1x -> 2.8x at 100%
    // NOTE: divisor of 61 is carried over from WhatIfSimulator's own
    // formula (Maitri's current batteryLevel) — keep in sync with that
    // file if it changes.
    const batteryFactor = stationEnergy.batteryLevel / 61;
    const nominalHours = Math.max(1, baselineHours * batteryFactor);
    const projected = Math.max(1, Math.round(nominalHours / multiplier));

    const spanHours = Math.max(nominalHours, projected);
    const step = spanHours / 8;
    const points = Array.from({ length: 9 }, (_, i) => {
      const hour = Math.round(i * step);
      return {
        hour,
        baselineBattery: Math.max(
          0,
          Math.round(stationEnergy.batteryLevel * (1 - hour / nominalHours))
        ),
        projectedBattery: Math.max(
          0,
          Math.round(stationEnergy.batteryLevel * (1 - hour / projected))
        ),
      };
    });

    return {
      data: points,
      projectedHours: projected,
      color: statusColor(projected),
    };
  }, [severity, stationEnergy]);

  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown size={18} className="text-text-muted" />
          <h3 className="text-base text-text-muted font-sans">
            Projected battery drain
          </h3>
        </div>
        <span className="text-sm font-mono" style={{ color }}>
          {projectedHours}h remaining · {stationName}
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
              dataKey="baselineBattery"
              name="Baseline"
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="projectedBattery"
              name={`Projected (${severity}% severity)`}
              stroke="#4CC9F0"
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
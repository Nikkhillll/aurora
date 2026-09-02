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
import { runSimulation, statusColorForHours } from "@/lib/simulationClient";

interface SimulationChartProps {
  /**
   * Storm severity 0-100, matching WhatIfSimulator's slider. Both
   * components now pull their projection from the same simulationClient,
   * so they can no longer disagree with each other.
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

  const [projectedHours, setProjectedHours] = useState(24);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    runSimulation({
      severity,
      station,
      batteryLevel: stationEnergy.batteryLevel,
    }).then((res) => {
      if (!cancelled) {
        setProjectedHours(res.projectedHours);
        setIsLive(res.isLive);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [severity, station, stationEnergy.batteryLevel]);

  const color = statusColorForHours(projectedHours);

  // Baseline (0% severity) is only used to draw the comparison line on
  // the chart — it doesn't need to hit the backend, since it's a fixed
  // reference point rather than the interactive projection.
  const baselineHours = Math.max(1, 48 * (stationEnergy.batteryLevel / 61));

  const spanHours = Math.max(baselineHours, projectedHours);
  const step = spanHours / 8;
  const data = Array.from({ length: 9 }, (_, i) => {
    const hour = Math.round(i * step);
    return {
      hour,
      baselineBattery: Math.max(
        0,
        Math.round(stationEnergy.batteryLevel * (1 - hour / baselineHours))
      ),
      projectedBattery: Math.max(
        0,
        Math.round(stationEnergy.batteryLevel * (1 - hour / projectedHours))
      ),
    };
  });

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
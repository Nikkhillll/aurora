"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Battery } from "lucide-react";
import { timeSeriesData, bharatiTimeSeriesData, stations } from "@/data/mockData";

interface BatteryTrendChartProps {
  station?: "maitri" | "bharati";
  lowThreshold?: number;
}

export default function BatteryTrendChart({
  station = "maitri",
  lowThreshold = 25,
}: BatteryTrendChartProps) {
  const data = station === "bharati" ? bharatiTimeSeriesData : timeSeriesData;
  const stationName =
    stations.find((s) => s.id === station)?.name ?? "Maitri";

  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Battery size={18} className="text-text-muted" />
          <h3 className="text-base text-text-muted font-sans">
            Battery Level Over Time
          </h3>
        </div>
        <span className="text-sm font-mono text-text-primary">
          {stationName}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="batteryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
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
              formatter={(value) => [`${value}%`, "Battery"]}
            />
            <ReferenceLine
              y={lowThreshold}
              stroke="#F5484F"
              strokeDasharray="4 4"
              label={{ value: "Low", position: "insideTopRight", fill: "#F5484F", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="battery"
              stroke="#34D399"
              strokeWidth={2}
              fill="url(#batteryFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
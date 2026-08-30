"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Thermometer } from "lucide-react";
import { timeSeriesData, bharatiTimeSeriesData, stations } from "@/data/mockData";

interface TempTrendChartProps {
  station?: "maitri" | "bharati";
}

export default function TempTrendChart({
  station = "maitri",
}: TempTrendChartProps) {
  const data = station === "bharati" ? bharatiTimeSeriesData : timeSeriesData;
  const stationName =
    stations.find((s) => s.id === station)?.name ?? "Maitri";

  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer size={18} className="text-text-muted" />
          <h3 className="text-base text-text-muted font-sans">
            Temperature — Last 24h
          </h3>
        </div>
        <span className="text-sm font-mono text-text-primary">
          {stationName}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={36}
              unit="°C"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value) => [`${value}°C`, "Temp"]}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#4CC9F0"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
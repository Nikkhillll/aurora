"use client";

import { useEffect, useState } from "react";
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
import ChartFrame from "./ChartFrame";

const ACCENT = "#4CC9F0";

export interface TemperaturePoint {
  time: string;
  temperature: number;
}

export interface TempTrendChartProps {
  /** Optional time-series dataset. Overrides API fetch if provided. */
  data?: TemperaturePoint[];
  /** Station identifier. Defaults to "maitri". */
  station?: "maitri" | "bharati";
  /** Optional custom title. Defaults to "Temperature — Last 24h". */
  title?: string;
  /** Explicit loading state override. */
  loading?: boolean;
  /** Explicit error message override. */
  error?: string | null;
}

export default function TempTrendChart({
  data,
  station = "maitri",
  title = "Temperature — Last 24h",
  loading: externalLoading = false,
  error: externalError = null,
}: TempTrendChartProps) {
  const [liveData, setLiveData] = useState<TemperaturePoint[] | null>(data ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(externalLoading);
  const [apiError, setApiError] = useState<string | null>(externalError);
  const [isLive, setIsLive] = useState<boolean>(false);

  const stationName =
    stations.find((s) => s.id === station)?.name ?? (station === "bharati" ? "Bharati" : "Maitri");

  useEffect(() => {
    // If external data prop is supplied, use it directly without fetching
    if (data) {
      setLiveData(data);
      setIsLoading(false);
      setApiError(null);
      setIsLive(false);
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      // Intentional local mock fallback when backend URL is not configured
      const fallback = station === "bharati" ? bharatiTimeSeriesData : timeSeriesData;
      setLiveData(fallback.map((p) => ({ time: p.time, temperature: p.temperature })));
      setIsLoading(false);
      setApiError(null);
      setIsLive(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setApiError(null);

    async function fetchTelemetry() {
      try {
        let res: Response | null = null;

        // Try GET /telemetry/{stationId}/history first
        try {
          res = await fetch(`${apiBase}/telemetry/${station}/history`, {
            signal: AbortSignal.timeout(3000),
          });
        } catch {
          res = null;
        }

        // If history route 404s or fails, fall back to GET /telemetry/{stationId}?metric=temperature
        if (!res || !res.ok) {
          res = await fetch(`${apiBase}/telemetry/${station}?metric=temperature&hours=24`, {
            signal: AbortSignal.timeout(3000),
          });
        }

        if (!res.ok) {
          throw new Error(`Telemetry API returned ${res.status}`);
        }

        const payload = await res.json();
        if (cancelled) return;

        const rawList: unknown[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.points)
          ? payload.points
          : [];

        const mapped: TemperaturePoint[] = rawList
          .map((item: unknown): TemperaturePoint | null => {
            if (typeof item !== "object" || item === null) return null;
            const rec = item as Record<string, unknown>;
            const rawVal = rec.temperature ?? rec.value;
            if (typeof rawVal !== "number") return null;

            let timeStr = String(rec.time ?? "");
            if (timeStr.includes("T")) {
              const d = new Date(timeStr);
              if (!isNaN(d.getTime())) {
                const hh = String(d.getUTCHours()).padStart(2, "0");
                const mm = String(d.getUTCMinutes()).padStart(2, "0");
                timeStr = `${hh}:${mm}`;
              }
            }
            return { time: timeStr, temperature: rawVal };
          })
          .filter((pt): pt is TemperaturePoint => pt !== null);

        setLiveData(mapped);
        setIsLive(true);
        setIsLoading(false);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load telemetry";
          setApiError(msg);
          setIsLoading(false);
          setIsLive(false);
        }
      }
    }

    fetchTelemetry();

    return () => {
      cancelled = true;
    };
  }, [station, data]);

  const effectiveLoading = externalLoading || isLoading;
  const effectiveError = externalError || apiError;

  const frame = { icon: Thermometer, title, accent: ACCENT, stationName };

  if (effectiveLoading) {
    return (
      <ChartFrame {...frame}>
        <p className="animate-pulse font-mono text-sm text-text-muted">Loading temperature trend...</p>
      </ChartFrame>
    );
  }

  if (effectiveError && (!liveData || liveData.length === 0)) {
    return (
      <ChartFrame {...frame}>
        <p role="alert" className="font-mono text-sm text-status-critical">
          {effectiveError}
        </p>
      </ChartFrame>
    );
  }

  if (!liveData || liveData.length === 0) {
    return (
      <ChartFrame {...frame}>
        <p className="font-mono text-sm text-text-muted">No temperature data recorded</p>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame {...frame} live={isLive}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={liveData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
            width={52}
            tickFormatter={(v: number) => `${Math.round(v)}°C`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => [`${value}°C`, "Temperature"]}
            cursor={{ stroke: "#334155", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={ACCENT}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: ACCENT, stroke: "#0f172a", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

import { bharatiTimeSeriesData, timeSeriesData } from "@/data/mockData";
import type { StationKey } from "@/lib/stationClient";
import { useStation } from "./StationProvider";

// Recharts measures the real DOM on mount, so render these client-only
// (avoids a hydration mismatch).
const TempChartBase = dynamic(() => import("@/components/Charts/TempTrendChart"), {
  ssr: false,
});
const BatteryChartBase = dynamic(() => import("@/components/Charts/BatteryTrendChart"), {
  ssr: false,
});

// Unchanged: the simulation chart handles its own fallback.
export const SimulationChart = dynamic(() => import("@/components/Charts/SimulationChart"), {
  ssr: false,
});

const sample = (station: StationKey) =>
  station === "bharati" ? bharatiTimeSeriesData : timeSeriesData;

/**
 * When the backend is offline we hand the chart sample data through its `data`
 * prop (which skips the network call). When the backend is live we pass nothing
 * and the chart fetches real history itself.
 */
export function TempTrendChart({ station }: { station: StationKey }) {
  const { live } = useStation();
  const data = useMemo(
    () =>
      live ? undefined : sample(station).map((p) => ({ time: p.time, temperature: p.temperature })),
    [live, station]
  );
  return <TempChartBase station={station} data={data} />;
}

export function BatteryTrendChart({ station }: { station: StationKey }) {
  const { live } = useStation();
  const data = useMemo(
    () => (live ? undefined : sample(station).map((p) => ({ time: p.time, battery: p.battery }))),
    [live, station]
  );
  return <BatteryChartBase station={station} data={data} />;
}
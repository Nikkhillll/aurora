"use client";

import { Gauge, Wind } from "lucide-react";

import CardShell, { Chip, Tile, Value } from "./CardShell";
import DialGauge from "./DialGauge";
import type { EnvironmentData } from "@/data/mockData";
import type { Status } from "@/lib/stationSummary";

const ACCENT = "#4CC9F0"; // ice-cyan — always environment

const riskColor = {
  Low: "#34D399",
  Moderate: "#F5A524",
  High: "#F5484F",
} as const;

interface EnvironmentCardProps {
  data: EnvironmentData;
  status?: Status;
}

export default function EnvironmentCard({ data, status }: EnvironmentCardProps) {
  return (
    <CardShell icon={Gauge} title="Environment" accent={ACCENT} status={status}>
      <div className="flex items-start justify-around gap-2">
        <DialGauge
          value={data.temperature}
          min={-60}
          max={0}
          unit="°C"
          label="Temperature"
          color={ACCENT}
        />
        <DialGauge
          value={data.pressure}
          min={920}
          max={1050}
          unit=" hPa"
          label="Pressure"
          color={ACCENT}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Wind} label="Wind speed" accent={ACCENT}>
          <Value unit="km/h" color={ACCENT}>
            {data.wind.toFixed(0)}
          </Value>
        </Tile>
        <Tile label="Weather risk">
          <Chip label={data.weatherRisk} color={riskColor[data.weatherRisk]} />
        </Tile>
      </div>
    </CardShell>
  );
}
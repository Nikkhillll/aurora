"use client";

import { Wind, Gauge } from "lucide-react";
import DialGauge from "./DialGauge";
import type { EnvironmentData } from "@/data/mockData";

const ACCENT = "#4CC9F0"; // ice-cyan — always environment

const riskColor = {
  Low: "#34D399",
  Moderate: "#F5A524",
  High: "#F5484F",
} as const;

interface EnvironmentCardProps {
  data: EnvironmentData;
}

export default function EnvironmentCard({ data }: EnvironmentCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <Gauge size={18} className="text-accent-env" />
        <h2 className="text-base text-text-muted font-sans">Environment</h2>
      </div>

      {/* Dial gauges row */}
      <div className="flex items-center justify-around gap-4">
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

            {/* Wind speed — own row, mirrors Solar/Wind row in Energy */}
      <div className="flex items-center gap-2">
        <Wind size={16} className="text-accent-env" />
        <div>
          <p className="text-sm text-text-muted font-sans">Wind speed</p>
          <p className="text-xl font-mono text-accent-env">
            {data.wind}
            <span className="text-sm text-text-muted ml-1">km/h</span>
          </p>
        </div>
      </div>
      {/* Weather risk — full width row, mirrors Generator row in Energy */}
      <div className="pt-1 border-border">
        <p className="text-sm text-text-muted font-sans mb-1">Weather risk</p>
        <span
        
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-medium"
          style={{
            color: riskColor[data.weatherRisk],
            backgroundColor: `${riskColor[data.weatherRisk]}14`,
            border: `1px solid ${riskColor[data.weatherRisk]}30`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: riskColor[data.weatherRisk] }}
          />
          {data.weatherRisk}
        </span>
      </div>
    </div>
  );
}

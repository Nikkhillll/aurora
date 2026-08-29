"use client";

import { Sun, Wind, Zap } from "lucide-react";
import DialGauge from "./DialGauge";
import type { EnergyData } from "@/data/mockData";

const ACCENT = "#FFB84D"; // amber — always energy

const generatorColor = {
  Online: "#34D399",
  Standby: "#F5A524",
  Offline: "#F5484F",
} as const;

interface EnergyCardProps {
  data: EnergyData;
}

export default function EnergyCard({ data }: EnergyCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-accent-energy" />
        <h2 className="text-base text-text-muted font-sans">Energy</h2>
      </div>

      {/* Battery dial gauge — centered */}
      <div className="flex justify-center">
        <DialGauge
          value={data.batteryLevel}
          min={0}
          max={100}
          unit="%"
          label="Battery level"
          color={ACCENT}
          size={200}
        />
      </div>

      {/* Generation readouts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Solar */}
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-accent-energy" />
          <div>
            <p className="text-sm text-text-muted font-sans">Solar</p>
            <p className="text-xl font-mono text-accent-energy">
              {data.solarGeneration}
              <span className="text-sm text-text-muted ml-1">kW</span>
            </p>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2">
          <Wind size={16} className="text-accent-energy" />
          <div>
            <p className="text-sm text-text-muted font-sans">Wind</p>
            <p className="text-xl font-mono text-accent-energy">
              {data.windGeneration}
              <span className="text-sm text-text-muted ml-1">kW</span>
            </p>
          </div>
        </div>
      </div>

      {/* Generator status */}
      <div>
        <p className="text-sm text-text-muted font-sans mb-1">Generator</p>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-medium"
          style={{
            color: generatorColor[data.generatorStatus],
            backgroundColor: `${generatorColor[data.generatorStatus]}14`,
            border: `1px solid ${generatorColor[data.generatorStatus]}30`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: generatorColor[data.generatorStatus] }}
          />
          {data.generatorStatus}
        </span>
      </div>
    </div>
  );
}

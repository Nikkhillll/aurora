"use client";

import { Sun, Wind, Zap } from "lucide-react";

import CardShell, { Chip, Tile, Value } from "./CardShell";
import DialGauge from "./DialGauge";
import type { EnergyData } from "@/data/mockData";
import type { Status } from "@/lib/stationSummary";

const ACCENT = "#FFB84D"; // amber — always energy

const generatorColor = {
  Online: "#34D399",
  Standby: "#F5A524",
  Offline: "#F5484F",
} as const;

interface EnergyCardProps {
  data: EnergyData;
  status?: Status;
}

export default function EnergyCard({ data, status }: EnergyCardProps) {
  // Live telemetry reports one combined generation figure (wind = 0).
  // Only split Solar / Wind when the data actually has both.
  const split = data.windGeneration > 0;

  return (
    <CardShell icon={Zap} title="Energy" accent={ACCENT} status={status}>
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

      <div className="grid grid-cols-2 gap-3">
        {split ? (
          <>
            <Tile icon={Sun} label="Solar" accent={ACCENT}>
              <Value unit="kW" color={ACCENT}>
                {data.solarGeneration.toFixed(1)}
              </Value>
            </Tile>
            <Tile icon={Wind} label="Wind" accent={ACCENT}>
              <Value unit="kW" color={ACCENT}>
                {data.windGeneration.toFixed(1)}
              </Value>
            </Tile>
          </>
        ) : (
          <Tile icon={Zap} label="Generation" accent={ACCENT}>
            <Value unit="kW" color={ACCENT}>
              {data.solarGeneration.toFixed(1)}
            </Value>
          </Tile>
        )}

        <Tile label="Generator" className={split ? "col-span-2" : ""}>
          <Chip label={data.generatorStatus} color={generatorColor[data.generatorStatus]} />
        </Tile>
      </div>
    </CardShell>
  );
}
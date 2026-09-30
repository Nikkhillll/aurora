"use client";

import { Building2 } from "lucide-react";

import CardShell, { CardMessage, Chip, Tile } from "./CardShell";
import DialGauge from "./DialGauge";
import type { InfrastructureData } from "@/data/mockData";
import type { Status } from "@/lib/stationSummary";

// Accent color for this card's domain (slate-blue — infrastructure)
const ACCENT = "#6C8EEF";

const conditionColor: Record<InfrastructureData["buildingCondition"], string> = {
  Good: "#34D399",
  Fair: "#F5A524",
  "Needs Attention": "#F5484F",
};

const zoneColor: Record<InfrastructureData["zoneStatus"], string> = {
  Normal: "#34D399",
  Warning: "#F5A524",
  Critical: "#F5484F",
};

interface InfrastructureCardProps {
  data: InfrastructureData;
  loading?: boolean;
  error?: string | null;
  status?: Status;
}

export default function InfrastructureCard({
  data,
  loading = false,
  error = null,
  status,
}: InfrastructureCardProps) {
  if (loading) {
    return (
      <CardShell icon={Building2} title="Infrastructure" accent={ACCENT}>
        <CardMessage pulse>Loading infrastructure telemetry...</CardMessage>
      </CardShell>
    );
  }

  if (error) {
    return (
      <CardShell icon={Building2} title="Infrastructure" accent={ACCENT}>
        <CardMessage tone="error">{error}</CardMessage>
      </CardShell>
    );
  }

  return (
    <CardShell icon={Building2} title="Infrastructure" accent={ACCENT} status={status}>
      <div className="flex items-start justify-around gap-2">
        <DialGauge
          value={data.equipmentHealth}
          min={0}
          max={100}
          unit="%"
          label="Equipment health"
          color={ACCENT}
        />
        <DialGauge
          value={data.sensorStatus}
          min={0}
          max={100}
          unit="%"
          label="Sensors online"
          color={ACCENT}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Building condition">
          <Chip
            label={data.buildingCondition}
            color={conditionColor[data.buildingCondition] ?? "#8592A3"}
          />
        </Tile>
        <Tile label="Zone status">
          <Chip label={data.zoneStatus} color={zoneColor[data.zoneStatus] ?? "#8592A3"} />
        </Tile>
      </div>
    </CardShell>
  );
}
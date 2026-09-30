"use client";

import { CalendarClock, Package, Truck } from "lucide-react";

import CardShell, { CardMessage, Chip, Tile, Value } from "./CardShell";
import DialGauge from "./DialGauge";
import type { LogisticsData } from "@/data/mockData";
import type { Status } from "@/lib/stationSummary";

// Accent color for this card's domain (violet — logistics)
const ACCENT = "#A78BFA";

/** Pick color based on fill level */
function levelColor(pct: number): string {
  if (pct < 30) return "#F5484F"; // critical
  if (pct < 50) return "#F5A524"; // warning
  return ACCENT; // nominal — use card accent
}

/** Semantic status for spare parts inventory */
function getSparePartsStatus(count: number): { label: string; color: string } {
  if (count < 15) return { label: "Critical", color: "#F5484F" };
  if (count < 25) return { label: "Low", color: "#F5A524" };
  return { label: "Nominal", color: "#34D399" };
}

interface LogisticsCardProps {
  data?: LogisticsData;
  loading?: boolean;
  error?: string | null;
  status?: Status;
}

export default function LogisticsCard({
  data,
  loading = false,
  error = null,
  status,
}: LogisticsCardProps) {
  if (loading) {
    return (
      <CardShell icon={Truck} title="Logistics" accent={ACCENT}>
        <CardMessage pulse>Loading logistics telemetry...</CardMessage>
      </CardShell>
    );
  }

  if (error) {
    return (
      <CardShell icon={Truck} title="Logistics" accent={ACCENT}>
        <CardMessage tone="error">{error}</CardMessage>
      </CardShell>
    );
  }

  if (!data) {
    return (
      <CardShell icon={Truck} title="Logistics" accent={ACCENT}>
        <CardMessage>No logistics data available</CardMessage>
      </CardShell>
    );
  }

  const partsStatus = getSparePartsStatus(data.spareParts);

  return (
    <CardShell icon={Truck} title="Logistics" accent={ACCENT} status={status}>
      <div className="flex items-start justify-around gap-2">
        <DialGauge
          value={data.fuelLevel}
          min={0}
          max={100}
          unit="%"
          label="Fuel level"
          color={levelColor(data.fuelLevel)}
        />
        <DialGauge
          value={data.foodSupplies}
          min={0}
          max={100}
          unit="%"
          label="Food supplies"
          color={levelColor(data.foodSupplies)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Package} label="Spare parts" accent={ACCENT}>
          <Value unit="units" color={ACCENT}>
            {data.spareParts}
          </Value>
          <Chip label={partsStatus.label} color={partsStatus.color} />
        </Tile>
        <Tile icon={CalendarClock} label="Resupply window" accent={ACCENT}>
          <p className="font-mono text-sm text-text-primary">{data.resupplyWindow}</p>
        </Tile>
      </div>
    </CardShell>
  );
}
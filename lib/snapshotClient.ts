/**
 * Snapshot client — fetches the full station snapshot from
 * GET /stations/{id}/snapshot and maps the backend's snake_case fields onto
 * the shapes Person 2's InfrastructureCard / LogisticsCard already expect
 * (see data/mockData.ts: InfrastructureData, LogisticsData).
 *
 * Same resilience pattern as lib/simulationClient.ts: on any failure this
 * returns null so the caller can keep showing mock data instead of breaking
 * the page.
 */

import type { InfrastructureData, LogisticsData } from "@/data/mockData";

export type StationKey = "maitri" | "bharati";

type BackendStatus = "nominal" | "warning" | "critical";

interface SnapshotZone {
  id: string;
  name: string;
  status: BackendStatus;
}

interface SnapshotInfrastructure {
  equipment_health_pct: number;
  building_condition: string;
  zones: SnapshotZone[];
  status: BackendStatus;
}

interface SnapshotLogistics {
  fuel_level_pct: number;
  supplies_level_pct: number;
  spare_parts_count: number;
  next_resupply: string; // ISO date, e.g. "2026-11-12"
  status: BackendStatus;
}

export interface StationSnapshot {
  station_id: string;
  timestamp: string;
  infrastructure: SnapshotInfrastructure;
  logistics: SnapshotLogistics;
  // environment / energy also exist on the real response but aren't mapped
  // here — those two cards are still on mock data as of this pass.
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchSnapshot(
  station: StationKey
): Promise<StationSnapshot | null> {
  if (!API_BASE) return null;

  try {
    const res = await fetch(`${API_BASE}/stations/${station}/snapshot`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) throw new Error(`Snapshot API returned ${res.status}`);
    return (await res.json()) as StationSnapshot;
  } catch {
    return null;
  }
}

// ── Field mapping: backend snake_case -> Person 2's existing prop shapes ──

const STATUS_TO_ZONE_LABEL: Record<BackendStatus, InfrastructureData["zoneStatus"]> = {
  nominal: "Normal",
  warning: "Warning",
  critical: "Critical",
};

/**
 * Backend's building_condition is a free string (currently always "stable"
 * from seeded/demo state). Mapped onto the closed set the UI expects.
 * FLAG: heuristic keyword match — confirm with Person 2, extend if the
 * backend starts emitting values that don't match these keywords.
 */
function mapBuildingCondition(raw: string): InfrastructureData["buildingCondition"] {
  const s = raw.toLowerCase();
  if (s.includes("inspect") || s.includes("attention")) return "Needs Attention";
  if (s.includes("wear") || s.includes("minor")) return "Fair";
  return "Good";
}

/**
 * FLAG: the backend has no direct "% sensors online" figure. Derived here
 * as the share of zones NOT reporting critical — a real computed value from
 * real data, not an invented number. Replace with a direct field if/when
 * the backend adds one.
 */
function deriveSensorStatus(zones: SnapshotZone[]): number {
  if (zones.length === 0) return 100;
  const healthy = zones.filter((z) => z.status !== "critical").length;
  return Math.round((healthy / zones.length) * 100);
}

export function mapInfrastructure(snap: StationSnapshot): InfrastructureData {
  const infra = snap.infrastructure;
  return {
    equipmentHealth: infra.equipment_health_pct,
    buildingCondition: mapBuildingCondition(infra.building_condition),
    sensorStatus: deriveSensorStatus(infra.zones),
    zoneStatus: STATUS_TO_ZONE_LABEL[infra.status],
  };
}

/**
 * FLAG: mock UI shows a resupply *range* ("Dec 15 - Dec 22, 2026"), backend
 * only gives a single ISO date. Rather than fabricate a fake end date, this
 * formats the one real date we have. Visible text changes from a range to
 * a single date — confirm with Person 2, this is a content change even
 * though no component code changes.
 */
function formatResupplyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapLogistics(snap: StationSnapshot): LogisticsData {
  const log = snap.logistics;
  return {
    fuelLevel: log.fuel_level_pct,
    foodSupplies: log.supplies_level_pct,
    spareParts: log.spare_parts_count,
    resupplyWindow: formatResupplyDate(log.next_resupply),
    // FLAG: log.status (backend) has nowhere to go — LogisticsData has no
    // status field today. Not wired up. See message to Person 2.
  };
}

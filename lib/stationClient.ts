export type StationKey = "maitri" | "bharati";

export interface StationSnapshot {
  station_id: string;
  timestamp: string;
  environment: {
    temperature_c: number;
    wind_speed_ms: number;
    pressure_hpa: number;
    visibility_km: number;
    status: "nominal" | "warning" | "critical";
  };
  energy: {
    battery_level_pct: number;
    generation_kw: number;
    consumption_kw: number;
    projected_hours_remaining: number;
    status: "nominal" | "warning" | "critical";
  };
  infrastructure: {
    equipment_health_pct: number;
    building_condition: string;
    zones: {
      id: string;
      name: string;
      status: "nominal" | "warning" | "critical";
    }[];
    status: "nominal" | "warning" | "critical";
  };
  logistics: {
    fuel_level_pct: number;
    supplies_level_pct: number;
    spare_parts_count: number;
    next_resupply: string;
    status: "nominal" | "warning" | "critical";
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchStationSnapshot(
  station: StationKey
): Promise<StationSnapshot | null> {
  if (!API_BASE) return null;

  try {
    const response = await fetch(
      `${API_BASE}/stations/${station}/snapshot`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      }
    );

    if (!response.ok) {
      throw new Error(`Snapshot API returned ${response.status}`);
    }

    return (await response.json()) as StationSnapshot;
  } catch {
    return null;
  }
}

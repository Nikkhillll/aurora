import {
  fetchStationSnapshot,
  type StationKey,
  type StationSnapshot,
} from "@/lib/stationClient";
import {
  environmentData,
  energyData,
  infrastructureData,
  logisticsData,
  bharatiEnvironmentData,
  bharatiEnergyData,
  bharatiInfrastructureData,
  bharatiLogisticsData,
} from "@/data/mockData";

export type Status = "nominal" | "warning" | "critical";

export const STATION_KEYS: StationKey[] = ["maitri", "bharati"];

export interface StationSummary {
  id: StationKey;
  status: Status; // worst of the four domains
  domains: { env: Status; power: Status; struct: Status; logistics: Status };
  temperatureC: number;
  windKmh: number;
  batteryPct: number;
  fuelPct: number;
  live: boolean; // true = real backend data, false = sample data
}

function worst(list: Status[]): Status {
  if (list.includes("critical")) return "critical";
  if (list.includes("warning")) return "warning";
  return "nominal";
}

function byThreshold(value: number): Status {
  return value < 30 ? "critical" : value < 50 ? "warning" : "nominal";
}

function fromSnapshot(id: StationKey, s: StationSnapshot): StationSummary {
  const domains = {
    env: s.environment.status,
    power: s.energy.status,
    struct: s.infrastructure.status,
    logistics: s.logistics.status,
  };
  return {
    id,
    status: worst(Object.values(domains)),
    domains,
    temperatureC: s.environment.temperature_c,
    windKmh: s.environment.wind_speed_ms * 3.6,
    batteryPct: s.energy.battery_level_pct,
    fuelPct: s.logistics.fuel_level_pct,
    live: true,
  };
}

function fromMock(id: StationKey): StationSummary {
  const bharati = id === "bharati";
  const env = bharati ? bharatiEnvironmentData : environmentData;
  const energy = bharati ? bharatiEnergyData : energyData;
  const infra = bharati ? bharatiInfrastructureData : infrastructureData;
  const logistics = bharati ? bharatiLogisticsData : logisticsData;

  const domains = {
    env:
      env.weatherRisk === "High"
        ? "critical"
        : env.weatherRisk === "Moderate"
          ? "warning"
          : "nominal",
    power: byThreshold(energy.batteryLevel),
    struct:
      infra.zoneStatus === "Critical"
        ? "critical"
        : infra.zoneStatus === "Warning"
          ? "warning"
          : "nominal",
    logistics: byThreshold(logistics.fuelLevel),
  } satisfies StationSummary["domains"];

  return {
    id,
    status: worst(Object.values(domains)),
    domains,
    temperatureC: env.temperature,
    windKmh: env.wind,
    batteryPct: energy.batteryLevel,
    fuelPct: logistics.fuelLevel,
    live: false,
  };
}

/** Live snapshot if the backend answers, otherwise sample data. Never throws. */
export async function fetchStationSummary(id: StationKey): Promise<StationSummary> {
  const snap = await fetchStationSnapshot(id);
  return snap ? fromSnapshot(id, snap) : fromMock(id);
}
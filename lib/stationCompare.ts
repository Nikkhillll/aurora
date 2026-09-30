import {
  stations,
  environmentData,
  energyData,
  infrastructureData,
  logisticsData,
  alerts as mockAlerts,
  bharatiEnvironmentData,
  bharatiEnergyData,
  bharatiInfrastructureData,
  bharatiLogisticsData,
  bharatiAlerts,
} from "@/data/mockData";
import { fetchStationSnapshot, type StationKey } from "@/lib/stationClient";
import { mapInfrastructure, mapLogistics } from "@/lib/snapshotClient";
import { generateAlerts } from "@/lib/alertsClient";
import { calculateColdExposure } from "@/lib/coldExposure";
import type { Status } from "@/lib/stationSummary";

export interface CompareData {
  id: StationKey;
  name: string;
  coordinates: string;
  live: boolean;
  overall: Status;
  domains: { env: Status; power: Status; struct: Status; logistics: Status };
  alertCount: number;

  temperatureC: number;
  windKmh: number;
  pressureHpa: number;
  weatherRisk: string;
  coldRisk: string;

  batteryPct: number;
  generationKw: number;
  hoursRemaining: number | null;
  generator: string;

  equipmentHealth: number;
  buildingCondition: string;

  fuelPct: number;
  suppliesPct: number;
  spareParts: number;
  resupply: string;
}

const byThreshold = (v: number): Status => (v < 30 ? "critical" : v < 50 ? "warning" : "nominal");

function worst(list: Status[]): Status {
  if (list.includes("critical")) return "critical";
  if (list.includes("warning")) return "warning";
  return "nominal";
}

/** Live snapshot when the backend answers, sample data otherwise. Never throws. */
export async function fetchStationCompare(id: StationKey): Promise<CompareData> {
  const snap = await fetchStationSnapshot(id);
  const bharati = id === "bharati";
  const cfg = stations.find((s) => s.id === id) ?? stations[0];

  const mock = bharati
    ? {
        env: bharatiEnvironmentData,
        energy: bharatiEnergyData,
        infra: bharatiInfrastructureData,
        logistics: bharatiLogisticsData,
        alerts: bharatiAlerts,
      }
    : {
        env: environmentData,
        energy: energyData,
        infra: infrastructureData,
        logistics: logisticsData,
        alerts: mockAlerts,
      };

  const temperatureC = snap ? snap.environment.temperature_c : mock.env.temperature;
  const windKmh = snap ? snap.environment.wind_speed_ms * 3.6 : mock.env.wind;
  const pressureHpa = snap ? snap.environment.pressure_hpa : mock.env.pressure;
  const weatherRisk = snap
    ? snap.environment.status === "critical"
      ? "High"
      : snap.environment.status === "warning"
        ? "Moderate"
        : "Low"
    : mock.env.weatherRisk;

  const batteryPct = snap ? snap.energy.battery_level_pct : mock.energy.batteryLevel;
  const generationKw = snap
    ? snap.energy.generation_kw
    : mock.energy.solarGeneration + mock.energy.windGeneration;
  const generator = snap
    ? snap.energy.status === "critical"
      ? "Offline"
      : snap.energy.status === "warning"
        ? "Standby"
        : "Online"
    : mock.energy.generatorStatus;

  const infra = snap ? mapInfrastructure(snap) : mock.infra;
  const logistics = snap ? mapLogistics(snap) : mock.logistics;

  const domains: CompareData["domains"] = {
    env: snap
      ? snap.environment.status
      : mock.env.weatherRisk === "High"
        ? "critical"
        : mock.env.weatherRisk === "Moderate"
          ? "warning"
          : "nominal",
    power: snap ? snap.energy.status : byThreshold(batteryPct),
    struct: snap
      ? snap.infrastructure.status
      : infra.zoneStatus === "Critical"
        ? "critical"
        : infra.zoneStatus === "Warning"
          ? "warning"
          : "nominal",
    logistics: snap ? snap.logistics.status : byThreshold(logistics.fuelLevel),
  };

  let alertCount = mock.alerts.length;
  if (snap) {
    try {
      const result = await generateAlerts({
        station: id,
        batteryLevel: batteryPct,
        windSpeed: windKmh,
        temperature: temperatureC,
      });
      alertCount = result.alerts.length;
    } catch {
      // keep the sample count
    }
  }

  return {
    id,
    name: cfg.name,
    coordinates: cfg.coordinates,
    live: snap !== null,
    overall: worst(Object.values(domains)),
    domains,
    alertCount,
    temperatureC,
    windKmh,
    pressureHpa,
    weatherRisk,
    coldRisk: calculateColdExposure(temperatureC, windKmh).risk,
    batteryPct,
    generationKw,
    hoursRemaining: snap?.energy.projected_hours_remaining ?? null,
    generator,
    equipmentHealth: infra.equipmentHealth,
    buildingCondition: infra.buildingCondition,
    fuelPct: logistics.fuelLevel,
    suppliesPct: logistics.foodSupplies,
    spareParts: logistics.spareParts,
    resupply: logistics.resupplyWindow,
  };
}
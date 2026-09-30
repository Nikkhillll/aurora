"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
  type Alert,
  type EnvironmentData,
  type EnergyData,
  type InfrastructureData,
  type LogisticsData,
  type StationConfig,
} from "@/data/mockData";
import { personnelSafetyData, type PersonnelSafetyData } from "@/data/personnelSafety";
import { fetchStationSnapshot, type StationKey, type StationSnapshot } from "@/lib/stationClient";
import { mapInfrastructure, mapLogistics } from "@/lib/snapshotClient";
import { generateAlerts } from "@/lib/alertsClient";
import { fetchPersonnelSafety } from "@/lib/personnelClient";
import type { Status } from "@/lib/stationSummary";

export interface StationData {
  key: StationKey;
  station: StationConfig;
  ready: boolean; // first load attempt finished
  live: boolean; // true = backend data, false = sample data
  updatedAt: Date | null;
  snapshot: StationSnapshot | null;
  env: EnvironmentData;
  energy: EnergyData;
  infra: InfrastructureData;
  logistics: LogisticsData;
  personnel: PersonnelSafetyData;
  alerts: Alert[];
  hoursRemaining: number | null; // battery endurance, live data only
  domains: { env: Status; power: Status; struct: Status; logistics: Status };
  overall: Status;
}

const StationContext = createContext<StationData | null>(null);

export function useStation(): StationData {
  const ctx = useContext(StationContext);
  if (!ctx) throw new Error("useStation must be used inside <StationProvider>");
  return ctx;
}

function mockFor(key: StationKey) {
  return key === "bharati"
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
}

const byThreshold = (v: number): Status => (v < 30 ? "critical" : v < 50 ? "warning" : "nominal");

function worst(list: Status[]): Status {
  if (list.includes("critical")) return "critical";
  if (list.includes("warning")) return "warning";
  return "nominal";
}

/**
 * Loads and refreshes (every 5s) all data for ONE station and shares it with every
 * page in the workspace, so switching pages never refetches. Mount it with
 * key={stationId} so changing station starts from a clean state.
 */
export function StationProvider({
  stationKey,
  children,
}: {
  stationKey: StationKey;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<StationSnapshot | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelSafetyData>(personnelSafetyData);
  const [ready, setReady] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const snap = await fetchStationSnapshot(stationKey);

      // Backend offline: the UI already falls back to sample data for everything,
      // so skip the personnel and alerts calls instead of failing every 5 seconds.
      if (!snap) {
        if (cancelled) return;
        setSnapshot(null);
        setUpdatedAt(new Date());
        setReady(true);
        return;
      }

      let personnelResult: PersonnelSafetyData | null = null;
      try {
        personnelResult = await fetchPersonnelSafety();
      } catch {
        personnelResult = null;
      }

      const result = await generateAlerts({
        station: stationKey,
        batteryLevel: snap.energy.battery_level_pct,
        windSpeed: snap.environment.wind_speed_ms * 3.6,
        temperature: snap.environment.temperature_c,
      });
      if (cancelled) return;

      setSnapshot(snap);
      if (personnelResult) setPersonnel(personnelResult);
      setLiveAlerts(result.alerts);
      setUpdatedAt(new Date());
      setReady(true);
    };

    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stationKey]);

  const mock = mockFor(stationKey);

  // Backend snapshot when available, sample data otherwise.
  const env: EnvironmentData = snapshot
    ? {
        temperature: snapshot.environment.temperature_c,
        wind: snapshot.environment.wind_speed_ms * 3.6, // m/s → km/h
        pressure: snapshot.environment.pressure_hpa,
        weatherRisk:
          snapshot.environment.status === "critical"
            ? "High"
            : snapshot.environment.status === "warning"
              ? "Moderate"
              : "Low",
      }
    : mock.env;

  const energy: EnergyData = snapshot
    ? {
        solarGeneration: snapshot.energy.generation_kw,
        windGeneration: 0,
        batteryLevel: snapshot.energy.battery_level_pct,
        generatorStatus:
          snapshot.energy.status === "critical"
            ? "Offline"
            : snapshot.energy.status === "warning"
              ? "Standby"
              : "Online",
      }
    : mock.energy;

  const infra = snapshot ? mapInfrastructure(snapshot) : mock.infra;
  const logistics = snapshot ? mapLogistics(snapshot) : mock.logistics;

  const domains: StationData["domains"] = {
    env: snapshot
      ? snapshot.environment.status
      : env.weatherRisk === "High"
        ? "critical"
        : env.weatherRisk === "Moderate"
          ? "warning"
          : "nominal",
    power: snapshot ? snapshot.energy.status : byThreshold(energy.batteryLevel),
    struct: snapshot
      ? snapshot.infrastructure.status
      : infra.zoneStatus === "Critical"
        ? "critical"
        : infra.zoneStatus === "Warning"
          ? "warning"
          : "nominal",
    logistics: snapshot ? snapshot.logistics.status : byThreshold(logistics.fuelLevel),
  };

  const value: StationData = {
    key: stationKey,
    station: stations.find((s) => s.id === stationKey) ?? stations[0],
    ready,
    live: snapshot !== null,
    updatedAt,
    snapshot,
    env,
    energy,
    infra,
    logistics,
    personnel,
    alerts: snapshot ? liveAlerts : mock.alerts,
    hoursRemaining: snapshot?.energy.projected_hours_remaining ?? null,
    domains,
    overall: worst(Object.values(domains)),
  };

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}
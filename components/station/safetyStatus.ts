import { calculateColdExposure } from "@/lib/coldExposure";
import type { Status } from "@/lib/stationSummary";

/** Single source of truth for the Safety status (used by the tile, twin and cascade strip). */
export function getSafetyStatus(temperatureC: number, windKmh: number, heatingStatus: string) {
  const cold = calculateColdExposure(temperatureC, windKmh);
  const status: Status =
    heatingStatus === "failed" || cold.risk === "HIGH"
      ? "critical"
      : cold.risk === "MEDIUM"
        ? "warning"
        : "nominal";
  return { status, coldRisk: cold.risk };
}
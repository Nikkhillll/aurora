/**
 * Simulation client — single source of truth for "what-if" projections.
 *
 * CONTRACT CONFIRMED WITH PERSON 1 (backend/app/routers/simulate.py +
 * backend/app/services/simulation.py) — this now matches the real
 * endpoint exactly, including Person 4's ML model output via ml_bridge.
 *
 *   POST {NEXT_PUBLIC_API_URL}/simulate
 *   body: { station_id: string, scenario: Scenario, severity: number }
 *   response: SimulationResponse (see below)
 *
 * Falls back to local math only if the backend isn't reachable yet
 * (e.g. not deployed, or NEXT_PUBLIC_API_URL not set).
 */

export type StationKey = "maitri" | "bharati";
export type Scenario = "storm" | "equipment_failure" | "resupply_delay";

export interface SimulationInput {
  severity: number;
  station: StationKey;
  scenario?: Scenario;
  /** Only used by the local fallback formula when the backend is offline. */
  batteryLevel: number;
}

interface RiskSnapshot {
  battery_hours_remaining: number;
  risk_level: "low" | "medium" | "high";
}

interface TimelinePoint {
  hour: number;
  battery_pct: number;
}

/** Exact shape returned by Person 1's real /simulate endpoint. */
export interface SimulationResponse {
  station_id: string;
  scenario: Scenario;
  severity: number;
  baseline: RiskSnapshot;
  projected: RiskSnapshot;
  timeline: TimelinePoint[];
  narrative: string;
}

export interface SimulationResult {
  projectedHours: number;
  baselineHours: number;
  riskLevel: "low" | "medium" | "high";
  narrative: string;
  timeline: TimelinePoint[];
  isLive: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function riskFromHours(hours: number): SimulationResult["riskLevel"] {
  if (hours <= 12) return "high";
  if (hours <= 24) return "medium";
  return "low";
}

/**
 * Local fallback — used only until the backend is reachable. Keeps the
 * same output shape as the real response so components never need to
 * branch on live vs. fallback.
 */
function localFallback(input: SimulationInput): SimulationResult {
  const baselineHours = 48;
  const multiplier = 1 + (input.severity / 100) * 1.8;
  const batteryFactor = input.batteryLevel / 61;
  const projectedHours = Math.max(
    1,
    Math.round((baselineHours * batteryFactor) / multiplier)
  );

  const timeline: TimelinePoint[] = Array.from({ length: 25 }, (_, hour) => ({
    hour,
    battery_pct: Math.max(
      0,
      Math.round(input.batteryLevel * (1 - hour / projectedHours))
    ),
  }));

  return {
    projectedHours,
    baselineHours: Math.round(baselineHours * batteryFactor),
    riskLevel: riskFromHours(projectedHours),
    narrative: `Offline mode — showing an estimated projection. At ${input.severity}% severity, battery endurance is estimated to fall to ${projectedHours}h.`,
    timeline,
    isLive: false,
  };
}

/**
 * Run a what-if simulation against the real backend, falling back to
 * local math if it's not reachable yet.
 */
export async function runSimulation(
  input: SimulationInput
): Promise<SimulationResult> {
  if (!API_BASE) {
    return localFallback(input);
  }

  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_id: input.station,
        scenario: input.scenario ?? "storm",
        severity: input.severity,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`Simulation API returned ${res.status}`);

    const data: SimulationResponse = await res.json();

    return {
      projectedHours: data.projected.battery_hours_remaining,
      baselineHours: data.baseline.battery_hours_remaining,
      riskLevel: data.projected.risk_level,
      narrative: data.narrative,
      timeline: data.timeline,
      isLive: true,
    };
  } catch {
    return localFallback(input);
  }
}

export function statusColorForRisk(risk: SimulationResult["riskLevel"]): string {
  if (risk === "high") return "#F5484F";
  if (risk === "medium") return "#F5A524";
  return "#34D399";
}
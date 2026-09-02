/**
 * Simulation client — single source of truth for "what-if" projections.
 *
 * WHY THIS FILE EXISTS:
 * WhatIfSimulator and SimulationChart both need the same projection math.
 * Before this file, that formula was duplicated in both components, which
 * meant they could silently drift out of sync (see the old comment in
 * SimulationChart.tsx flagging exactly this risk).
 *
 * HOW IT WORKS RIGHT NOW (no backend yet):
 * runSimulation() tries a real backend endpoint first. If that call fails
 * (backend not deployed yet, network error, wrong URL, etc.), it silently
 * falls back to a local formula so the UI never breaks. This means:
 *   - Today, with no backend running: everything works using the fallback.
 *   - The moment Person 1's real /simulate endpoint is live and
 *     NEXT_PUBLIC_API_URL is set, this same code automatically starts
 *     using real ML-backed predictions — zero changes needed in the
 *     components that call it.
 *
 * EXPECTED BACKEND CONTRACT (confirm with Person 1, update below if it
 * ends up different):
 *   POST {NEXT_PUBLIC_API_URL}/simulate
 *   body: { severity: number, stationId: "maitri" | "bharati", batteryLevel: number }
 *   response: { projectedHours: number, riskLevel: "low" | "medium" | "high" }
 */

export type StationKey = "maitri" | "bharati";

export interface SimulationInput {
  /** Storm severity 0-100, from the WhatIfSimulator slider. */
  severity: number;
  station: StationKey;
  /** Current battery level (%) for the station being simulated. */
  batteryLevel: number;
}

export interface SimulationResult {
  projectedHours: number;
  riskLevel: "low" | "medium" | "high";
  /** True if this came from the real backend, false if using local fallback. */
  isLive: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function riskFromHours(hours: number): SimulationResult["riskLevel"] {
  if (hours <= 12) return "high";
  if (hours <= 24) return "medium";
  return "low";
}

/**
 * Local fallback formula — used until the real backend is live.
 * This is the same math that used to live separately in WhatIfSimulator
 * and SimulationChart; it now lives in exactly one place.
 */
function localFallback(input: SimulationInput): SimulationResult {
  const baselineHours = 48;
  const multiplier = 1 + (input.severity / 100) * 1.8; // 1x -> 2.8x at 100%
  const batteryFactor = input.batteryLevel / 61; // 61 = Maitri's baseline mock value
  const projectedHours = Math.max(
    1,
    Math.round((baselineHours * batteryFactor) / multiplier)
  );

  return {
    projectedHours,
    riskLevel: riskFromHours(projectedHours),
    isLive: false,
  };
}

/**
 * Run a what-if simulation. Tries the real backend first, falls back to
 * local math if the backend isn't reachable yet.
 */
export async function runSimulation(
  input: SimulationInput
): Promise<SimulationResult> {
  if (!API_BASE) {
    // No backend URL configured yet — don't even attempt a network call.
    return localFallback(input);
  }

  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        severity: input.severity,
        stationId: input.station,
        batteryLevel: input.batteryLevel,
      }),
      // Keep this snappy — don't let a slow/dead backend freeze the slider.
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) throw new Error(`Simulation API returned ${res.status}`);

    const data = await res.json();

    if (
      typeof data.projectedHours !== "number" ||
      typeof data.riskLevel !== "string"
    ) {
      throw new Error("Simulation API response shape didn't match expected contract");
    }

    return {
      projectedHours: data.projectedHours,
      riskLevel: data.riskLevel,
      isLive: true,
    };
  } catch {
    // Backend not up yet, or contract mismatch — fall back quietly.
    return localFallback(input);
  }
}

export function statusColorForHours(hours: number): string {
  if (hours <= 12) return "#F5484F"; // critical
  if (hours <= 24) return "#F5A524"; // warning
  return "#34D399"; // nominal
}
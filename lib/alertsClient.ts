import type { Alert } from "@/data/mockData";
import type { StationKey } from "@/lib/simulationClient";

export interface AlertsResult {
  alerts: Alert[];
  isLive: boolean;
}

interface StationConditions {
  station: StationKey;
  batteryLevel: number;
  windSpeed?: number;
  temperature?: number;
}

interface BackendAlert {
  id: string;
  station_id?: string;
  severity: "low" | "medium" | "high" | "critical";
  title?: string;
  message?: string;
  source?: string;
  created_at?: string;
  acknowledged?: boolean;
}

interface BackendAlertsResponse {
  value?: BackendAlert[];
  Count?: number;
}

/**
 * Local fallback alerts.
 *
 * These are used only when the backend cannot be reached.
 */
function localFallback(
  conditions: StationConditions
): Alert[] {
  const alerts: Alert[] = [];

  if (conditions.batteryLevel <= 20) {
    alerts.push({
      id: `battery-${conditions.station}`,
      severity:
        conditions.batteryLevel <= 10
          ? "high"
          : "medium",
      message: `Battery reserve low — ${conditions.batteryLevel}% remaining`,
    });
  }

  if (
    conditions.windSpeed !== undefined &&
    conditions.windSpeed >= 60
  ) {
    alerts.push({
      id: `wind-${conditions.station}`,
      severity:
        conditions.windSpeed >= 90
          ? "high"
          : "medium",
      message: `High wind speed detected — ${conditions.windSpeed} km/h`,
    });
  }

  if (
    conditions.temperature !== undefined &&
    conditions.temperature <= -40
  ) {
    alerts.push({
      id: `temperature-${conditions.station}`,
      severity: "medium",
      message: `Extreme low temperature — ${conditions.temperature}°C`,
    });
  }

  return alerts;
}

/**
 * Convert one backend alert to the frontend Alert type.
 */
function mapBackendAlert(
  alert: BackendAlert
): Alert {
  return {
    id: alert.id,
    severity: alert.severity,
    message:
      alert.title && alert.message
        ? `${alert.title}: ${alert.message}`
        : alert.message ||
          alert.title ||
          "Risk condition detected",
  };
}

/**
 * Fetch live alerts from FastAPI.
 */
export async function generateAlerts(
  conditions: StationConditions
): Promise<AlertsResult> {
  if (!API_BASE) {
    console.error(
      "AURORA: NEXT_PUBLIC_API_URL is missing."
    );

    return {
      alerts: localFallback(conditions),
      isLive: false,
    };
  }

  try {
    const url = `${API_BASE}/alerts/${conditions.station}`;

    console.log(
      "AURORA: fetching live alerts:",
      url
    );

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      throw new Error(
        `Alerts API returned HTTP ${response.status}`
      );
    }

    const data: unknown = await response.json();

    /*
     * DEBUG:
     * Show exactly what the browser received.
     */
    console.log(
      "AURORA: raw alerts response:",
      data
    );

    /*
     * FastAPI currently returns:
     *
     * {
     *   value: [...],
     *   Count: 1
     * }
     *
     * But we also accept a plain array in case the
     * backend response changes.
     */

    let backendAlerts: BackendAlert[] = [];

    if (Array.isArray(data)) {
      backendAlerts = data as BackendAlert[];
    } else if (
      data &&
      typeof data === "object"
    ) {
      const responseData =
        data as BackendAlertsResponse;

      if (Array.isArray(responseData.value)) {
        backendAlerts = responseData.value;
      }
    }

    /*
     * If neither format was received, this is a real
     * response-format problem.
     */
    if (!Array.isArray(backendAlerts)) {
      throw new Error(
        "Invalid alerts response format"
      );
    }

    /*
     * Remove acknowledged alerts.
     */
    const activeAlerts = backendAlerts
      .filter(
        (alert) => alert.acknowledged !== true
      )
      .map(mapBackendAlert);

    console.log(
      "AURORA: mapped live alerts:",
      activeAlerts
    );

    return {
      alerts: activeAlerts,
      isLive: true,
    };
  } catch (error) {
    console.error(
      "AURORA Alerts API failed:",
      error
    );

    return {
      alerts: localFallback(conditions),
      isLive: false,
    };
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL;
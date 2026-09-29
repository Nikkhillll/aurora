export type ColdExposureRisk = "LOW" | "MEDIUM" | "HIGH";

interface ColdExposureResult {
  windChillC: number;
  risk: ColdExposureRisk;
}

/**
 * Calculates wind chill using the National Weather Service formula.
 *
 * This is an operational environmental-risk indicator,
 * not a medical diagnosis or individual exposure-time guarantee.
 */
export function calculateColdExposure(
  temperatureC: number,
  windSpeedKmh: number
): ColdExposureResult {
  // Convert Celsius → Fahrenheit
  const temperatureF = (temperatureC * 9) / 5 + 32;

  // Convert km/h → mph
  const windMph = windSpeedKmh * 0.621371;

  let windChillF = temperatureF;

  // NWS wind-chill formula applies at <= 50°F
  // and wind speeds above approximately 3 mph.
  if (temperatureF <= 50 && windMph > 3) {
    windChillF =
      35.74 +
      0.6215 * temperatureF -
      35.75 * Math.pow(windMph, 0.16) +
      0.4275 * temperatureF * Math.pow(windMph, 0.16);
  }

  const windChillC = ((windChillF - 32) * 5) / 9;

  /*
   * Operational risk bands.
   *
   * These are dashboard classification thresholds,
   * not medical exposure limits.
   */
  let risk: ColdExposureRisk;

  if (windChillC <= -29) {
    risk = "HIGH";
  } else if (windChillC <= -10) {
    risk = "MEDIUM";
  } else {
    risk = "LOW";
  }

  return {
    windChillC: Number(windChillC.toFixed(1)),
    risk,
  };
}
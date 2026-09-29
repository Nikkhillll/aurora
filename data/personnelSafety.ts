export interface PersonnelSafetyData {
  totalPersonnel: number;
  onSite: number;
  onLeave: number;

  heatingStatus: "online" | "failed";
  safeEvacuationHours: number;

  temperatureC: number;
  windSpeedKmh: number;
  exposureHours: number;

  coldExposureRisk: "LOW" | "MEDIUM" | "HIGH";
  overallStatus: "NOMINAL" | "WARNING" | "CRITICAL";
}

export const personnelSafetyData: PersonnelSafetyData = {
  totalPersonnel: 42,
  onSite: 39,
  onLeave: 3,

  heatingStatus: "online",
  safeEvacuationHours: 6,

  temperatureC: -18,
  windSpeedKmh: 32,
  exposureHours: 1,

  coldExposureRisk: "LOW",
  overallStatus: "NOMINAL",
};
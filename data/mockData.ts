// data/mockData.ts
// Shared mock data source for AURORA dashboard — Antarctic Research Station Monitoring
// All components should import from this file to avoid shape mismatches

export interface EnvironmentData {
  temperature: number; // Celsius
  wind: number; // km/h
  pressure: number; // hPa
  weatherRisk: "Low" | "Moderate" | "High";
}

export interface EnergyData {
  solarGeneration: number; // kW
  windGeneration: number; // kW
  batteryLevel: number; // percentage
  generatorStatus: "Online" | "Standby" | "Offline";
}

export interface InfrastructureData {
  equipmentHealth: number; // percentage
  buildingCondition: "Good" | "Fair" | "Needs Attention";
  sensorStatus: number; // percentage of sensors online
  zoneStatus: "Normal" | "Warning" | "Critical";
}

export interface LogisticsData {
  fuelLevel: number; // percentage
  foodSupplies: number; // percentage
  spareParts: number; // count
  resupplyWindow: string; // date string
}

export interface Alert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
}

export interface TimeSeriesPoint {
  time: string; // e.g. "00:00"
  temperature: number;
  battery: number;
}

export interface StationConfig {
  id: string;
  name: string;
  coordinates: string;
  lat: string;
  lon: string;
}

// --- STATION CONFIGS ---

export const stations: StationConfig[] = [
  {
    id: "maitri",
    name: "Maitri",
    coordinates: "70.77°S 11.73°E",
    lat: "70.77°S",
    lon: "11.73°E",
  },
  {
    id: "bharati",
    name: "Bharati",
    coordinates: "69.41°S 76.19°E",
    lat: "69.41°S",
    lon: "76.19°E",
  },
];

// --- MAITRI MOCK VALUES (realistic Antarctic winter/station ranges) ---

export const environmentData: EnvironmentData = {
  temperature: -34.5,
  wind: 42,
  pressure: 968,
  weatherRisk: "Moderate",
};

export const energyData: EnergyData = {
  solarGeneration: 2.4,
  windGeneration: 8.1,
  batteryLevel: 61,
  generatorStatus: "Standby",
};

export const infrastructureData: InfrastructureData = {
  equipmentHealth: 87,
  buildingCondition: "Good",
  sensorStatus: 94,
  zoneStatus: "Normal",
};

export const logisticsData: LogisticsData = {
  fuelLevel: 58,
  foodSupplies: 72,
  spareParts: 34,
  resupplyWindow: "Dec 15 - Dec 22, 2026",
};

export const alerts: Alert[] = [
  {
    id: "1",
    severity: "high",
    message: "Battery reserve low — approx. 18hrs remaining at current draw",
  },
  {
    id: "2",
    severity: "medium",
    message: "Storm risk rising — expected within next 6hrs",
  },
  {
    id: "3",
    severity: "low",
    message: "Sensor cluster B reporting intermittent signal",
  },
];

export const timeSeriesData: TimeSeriesPoint[] = [
  { time: "00:00", temperature: -32, battery: 78 },
  { time: "02:00", temperature: -33, battery: 75 },
  { time: "04:00", temperature: -35, battery: 71 },
  { time: "06:00", temperature: -36, battery: 68 },
  { time: "08:00", temperature: -34, battery: 65 },
  { time: "10:00", temperature: -31, battery: 63 },
  { time: "12:00", temperature: -29, battery: 64 },
  { time: "14:00", temperature: -30, battery: 62 },
  { time: "16:00", temperature: -33, battery: 61 },
  { time: "18:00", temperature: -35, battery: 60 },
  { time: "20:00", temperature: -34, battery: 61 },
  { time: "22:00", temperature: -33, battery: 61 },
];

// --- BHARATI MOCK VALUES (slightly different conditions) ---

export const bharatiEnvironmentData: EnvironmentData = {
  temperature: -28.2,
  wind: 56,
  pressure: 982,
  weatherRisk: "High",
};

export const bharatiEnergyData: EnergyData = {
  solarGeneration: 1.8,
  windGeneration: 11.3,
  batteryLevel: 44,
  generatorStatus: "Online",
};

export const bharatiInfrastructureData: InfrastructureData = {
  equipmentHealth: 79,
  buildingCondition: "Fair",
  sensorStatus: 88,
  zoneStatus: "Warning",
};

export const bharatiLogisticsData: LogisticsData = {
  fuelLevel: 41,
  foodSupplies: 65,
  spareParts: 18,
  resupplyWindow: "Jan 5 - Jan 12, 2027",
};

export const bharatiAlerts: Alert[] = [
  {
    id: "b1",
    severity: "high",
    message: "Wind speed exceeding safe operational threshold — 56 km/h sustained",
  },
  {
    id: "b2",
    severity: "high",
    message: "Battery level critical — generator auto-started",
  },
  {
    id: "b3",
    severity: "medium",
    message: "Fuel reserves below 45% — resupply recommended",
  },
  {
    id: "b4",
    severity: "low",
    message: "Building thermal efficiency decreased 8% — inspect insulation",
  },
];

export const bharatiTimeSeriesData: TimeSeriesPoint[] = [
  { time: "00:00", temperature: -26, battery: 62 },
  { time: "02:00", temperature: -27, battery: 58 },
  { time: "04:00", temperature: -29, battery: 54 },
  { time: "06:00", temperature: -30, battery: 50 },
  { time: "08:00", temperature: -28, battery: 47 },
  { time: "10:00", temperature: -25, battery: 45 },
  { time: "12:00", temperature: -24, battery: 44 },
  { time: "14:00", temperature: -26, battery: 43 },
  { time: "16:00", temperature: -28, battery: 44 },
  { time: "18:00", temperature: -29, battery: 44 },
  { time: "20:00", temperature: -28, battery: 44 },
  { time: "22:00", temperature: -27, battery: 44 },
];

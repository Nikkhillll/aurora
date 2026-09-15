export interface RouteWaypoint {
  name: string;
  lat: number;
  lng: number;
  type: "port" | "waypoint" | "station";
  eta?: string;
}

export const RESUPPLY_ROUTES = {
  maitri: {
    name: "Cape Town → Maitri Station",
    waypoints: [
      {
        name: "Cape Town Port",
        lat: -33.9249,
        lng: 18.4241,
        type: "port" as const,
      },
      {
        name: "Open Ocean Waypoint 1",
        lat: -45.0,
        lng: 15.0,
        type: "waypoint" as const,
      },
      {
        name: "Southern Ocean Waypoint",
        lat: -58.0,
        lng: 12.0,
        type: "waypoint" as const,
      },
      {
        name: "Ice Edge Approach",
        lat: -68.0,
        lng: 11.8,
        type: "waypoint" as const,
      },
      {
        name: "Maitri Station",
        lat: -70.766,
        lng: 11.7383,
        type: "station" as const,
      },
    ],
    total_distance_km: 4067,
    typical_duration_days: 12,
  },

  bharati: {
    name: "Cape Town → Bharati Station",
    waypoints: [
      {
        name: "Cape Town Port",
        lat: -33.9249,
        lng: 18.4241,
        type: "port" as const,
      },
      {
        name: "Open Ocean Waypoint 1",
        lat: -45.0,
        lng: 45.0,
        type: "waypoint" as const,
      },
      {
        name: "Southern Ocean Waypoint",
        lat: -62.0,
        lng: 68.0,
        type: "waypoint" as const,
      },
      {
        name: "Ice Edge Approach",
        lat: -68.5,
        lng: 75.5,
        type: "waypoint" as const,
      },
      {
        name: "Bharati Station",
        lat: -69.4067,
        lng: 76.19,
        type: "station" as const,
      },
    ],
    total_distance_km: 5940,
    typical_duration_days: 18,
  },
} as const;
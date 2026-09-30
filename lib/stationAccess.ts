import type { User } from "@/lib/authClient";
import type { StationKey } from "@/lib/stationClient";
import { stationHref } from "@/lib/routes";

const ALL_STATIONS: StationKey[] = ["maitri", "bharati"];

// Front-end assignment map. The User model has no station field yet.
// Accounts not listed here get every station. Change that default below if you prefer.
const ASSIGNMENTS: Record<string, StationKey[]> = {
  "operator@aurora.ncpor.res.in": ["maitri"],
  "scientist@aurora.ncpor.res.in": ["bharati"],
};

export function allowedStations(user: User): StationKey[] {
  if (user.role === "admin") return ALL_STATIONS;
  return ASSIGNMENTS[user.email.toLowerCase()] ?? ALL_STATIONS;
}

export function canAccess(user: User, id: string): boolean {
  return allowedStations(user).includes(id as StationKey);
}

/** Where a user should land after login: their only station, or the picker. */
export function homeFor(user: User): string {
  const allowed = allowedStations(user);
  return allowed.length === 1 ? stationHref(allowed[0]) : "/stations";
}
import type { PersonnelSafetyData } from "@/data/personnelSafety";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchPersonnelSafety(): Promise<PersonnelSafetyData> {
  const response = await fetch(
    `${API_BASE_URL}/api/personnel/safety`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch personnel safety: ${response.status}`
    );
  }

  return response.json();
}
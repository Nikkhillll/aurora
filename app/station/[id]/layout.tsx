import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import StationShell from "@/components/station/StationShell";
import { STATION_KEYS } from "@/lib/stationSummary";
import type { StationKey } from "@/lib/stationClient";

export function generateStaticParams() {
  return STATION_KEYS.map((id) => ({ id }));
}

export default async function StationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!STATION_KEYS.includes(id as StationKey)) notFound();

  return <StationShell stationId={id as StationKey}>{children}</StationShell>;
}
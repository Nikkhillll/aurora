"use client";

import PageHeader from "@/components/station/PageHeader";
import PersonnelSafetyCard from "@/components/PersonnelSafetyCard";
import { useStation } from "@/components/station/StationProvider";

export default function SafetyPage() {
  const { station, personnel, env } = useStation();

  return (
    <>
      <PageHeader
        title="Personnel safety"
        description={`Headcount, heating and cold-exposure risk at ${station.name}.`}
      />
      <div className="max-w-2xl">
        <PersonnelSafetyCard
          data={{ ...personnel, temperatureC: env.temperature, windSpeedKmh: env.wind }}
        />
      </div>
    </>
  );
}
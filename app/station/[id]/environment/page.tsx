"use client";

import EnvironmentCard from "@/components/EnvironmentCard";
import PageHeader from "@/components/station/PageHeader";
import { useStation } from "@/components/station/StationProvider";
import { TempTrendChart } from "@/components/station/charts";

export default function EnvironmentPage() {
  const { key, station, env, domains } = useStation();

  return (
    <>
      <PageHeader
        title="Environment"
        description={`Temperature, pressure and wind at ${station.name}.`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <EnvironmentCard data={env} status={domains.env} />
        <TempTrendChart station={key} />
      </div>
    </>
  );
}
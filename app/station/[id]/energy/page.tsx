"use client";

import EnergyCard from "@/components/EnergyCard";
import PageHeader from "@/components/station/PageHeader";
import { useStation } from "@/components/station/StationProvider";
import { BatteryTrendChart } from "@/components/station/charts";

export default function EnergyPage() {
  const { key, station, energy, domains } = useStation();

  return (
    <>
      <PageHeader
        title="Energy"
        description={`Battery, generation and generator status at ${station.name}.`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <EnergyCard data={energy} status={domains.power} />
        <BatteryTrendChart station={key} />
      </div>
    </>
  );
}
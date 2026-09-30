"use client";

import LogisticsCard from "@/components/LogisticsCard";
import ResupplyRouteMap from "@/components/ResupplyRouteMap";
import PageHeader from "@/components/station/PageHeader";
import { useStation } from "@/components/station/StationProvider";

export default function LogisticsPage() {
  const { key, station, logistics, snapshot, domains } = useStation();

  return (
    <>
      <PageHeader
        title="Logistics"
        description={`Fuel, supplies and the resupply route for ${station.name}.`}
      />
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <LogisticsCard data={logistics} status={domains.logistics} />
        </div>
        <ResupplyRouteMap
          station={key}
          nextResupplyDate={snapshot?.logistics.next_resupply ?? "2026-11-15"}
        />
      </div>
    </>
  );
}
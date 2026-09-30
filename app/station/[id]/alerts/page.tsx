"use client";

import AlertsPanel from "@/components/AlertsPanel";
import PageHeader from "@/components/station/PageHeader";
import { useStation } from "@/components/station/StationProvider";

export default function AlertsPage() {
  const { station, alerts } = useStation();

  return (
    <>
      <PageHeader title="Alerts" description={`Active risk alerts for ${station.name}.`} />
      <div className="max-w-3xl">
        <AlertsPanel alerts={alerts} />
      </div>
    </>
  );
}
"use client";

import InfrastructureCard from "@/components/InfrastructureCard";
import PageHeader from "@/components/station/PageHeader";
import { useStation } from "@/components/station/StationProvider";
import { STATUS_META } from "@/components/station/StatusPill";

export default function InfrastructurePage() {
  const { station, infra, snapshot, domains } = useStation();
  const zones = snapshot?.infrastructure.zones ?? [];

  return (
    <>
      <PageHeader
        title="Infrastructure"
        description={`Equipment health and zone status at ${station.name}.`}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <InfrastructureCard data={infra} status={domains.struct} />

        <section
          aria-label="Zones"
          className="rounded-xl border border-border bg-bg-card p-5"
        >
          <h2 className="text-base font-medium text-text-primary">Zones</h2>

          {zones.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {zones.map((z) => {
                const m = STATUS_META[z.status];
                return (
                  <li
                    key={z.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-bg-base/60 px-3 py-2.5"
                  >
                    <span className="text-sm text-text-primary">{z.name}</span>
                    <span
                      className="flex items-center gap-1.5 font-mono text-xs"
                      style={{ color: m.color }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                      {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm leading-relaxed text-text-muted">
              Zone-by-zone status appears here when live telemetry is connected. Overall zone
              status is shown on the infrastructure card.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
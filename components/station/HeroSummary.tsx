"use client";

import { useStation, type StationData } from "./StationProvider";
import StatusPill from "./StatusPill";

function buildSentence(d: StationData): string {
  const reasons: string[] = [];

  if (d.domains.env !== "nominal")
    reasons.push(`weather risk is ${d.env.weatherRisk.toLowerCase()} with ${d.env.wind.toFixed(0)} km/h wind`);
  if (d.domains.power !== "nominal")
    reasons.push(
      `battery is at ${d.energy.batteryLevel.toFixed(0)}%` +
        (d.hoursRemaining != null ? `, about ${d.hoursRemaining.toFixed(0)} h of reserve` : "")
    );
  if (d.domains.struct !== "nominal")
    reasons.push(`infrastructure zone status is ${d.infra.zoneStatus.toLowerCase()}`);
  if (d.domains.logistics !== "nominal")
    reasons.push(`fuel is at ${d.logistics.fuelLevel.toFixed(0)}%`);

  if (reasons.length === 0) return "All four operational domains are nominal. No action required.";

  const text = reasons.join("; ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export default function HeroSummary() {
  const d = useStation();
  const count = d.alerts.length;

  return (
    <section className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted">Station overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary sm:text-3xl">
            {d.station.name}
            <span className="ml-3 font-mono text-sm font-normal text-text-muted">
              {d.station.coordinates}
            </span>
          </h1>
        </div>
        <StatusPill status={d.overall} />
      </div>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-primary">
        {buildSentence(d)}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-text-muted">
        <span>
          {count} active alert{count === 1 ? "" : "s"}
        </span>
        <span>{d.live ? "Live telemetry" : "Sample data (backend offline)"}</span>
        {d.updatedAt && <span>Updated {d.updatedAt.toLocaleTimeString()}</span>}
      </div>
    </section>
  );
}
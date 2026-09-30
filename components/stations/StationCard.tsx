import Link from "next/link";
import { ArrowRight, Thermometer, Wind, Battery, Fuel } from "lucide-react";
import type { StationConfig } from "@/data/mockData";
import type { StationKey } from "@/lib/stationClient";
import type { Status, StationSummary } from "@/lib/stationSummary";
import { stationHref } from "@/lib/routes";

const STATUS: Record<Status, { label: string; color: string }> = {
  nominal: { label: "NOMINAL", color: "#34D399" },
  warning: { label: "WARNING", color: "#F5A524" },
  critical: { label: "CRITICAL", color: "#F5484F" },
};

const DOMAIN_LABELS: { key: keyof StationSummary["domains"]; label: string }[] = [
  { key: "env", label: "Environment" },
  { key: "power", label: "Energy" },
  { key: "struct", label: "Infrastructure" },
  { key: "logistics", label: "Logistics" },
];

function Stat({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-base/60 p-3">
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Icon size={13} />
        {label}
      </div>
      <p className="mt-1.5 font-mono text-xl text-text-primary">
        {value}
        <span className="ml-1 text-xs text-text-muted">{unit}</span>
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-18.5 rounded-lg bg-border/40" />
        ))}
      </div>
      <div className="mt-5 h-4 w-2/3 rounded bg-border/40" />
    </div>
  );
}

export default function StationCard({
  station,
  summary,
}: {
  station: StationConfig;
  summary: StationSummary | null;
}) {
  const status = summary ? STATUS[summary.status] : null;

  return (
    <Link
      href={stationHref(station.id as StationKey)}
      className="group flex flex-col gap-5 rounded-2xl border border-border bg-bg-card p-6 transition-colors hover:border-accent-env/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">{station.name}</h2>
          <p className="mt-1 font-mono text-sm text-text-muted">{station.coordinates}</p>
        </div>

        {status ? (
          <span
            className="rounded-full border px-2.5 py-0.5 font-mono text-xs"
            style={{
              color: status.color,
              backgroundColor: `${status.color}14`,
              borderColor: `${status.color}40`,
            }}
          >
            {status.label}
          </span>
        ) : (
          <span className="h-6 w-20 animate-pulse rounded-full bg-border/40" />
        )}
      </div>

      {summary ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={Thermometer} label="Temperature" value={summary.temperatureC.toFixed(1)} unit="°C" />
            <Stat icon={Wind} label="Wind" value={summary.windKmh.toFixed(0)} unit="km/h" />
            <Stat icon={Battery} label="Battery" value={summary.batteryPct.toFixed(0)} unit="%" />
            <Stat icon={Fuel} label="Fuel" value={summary.fuelPct.toFixed(0)} unit="%" />
          </div>

          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {DOMAIN_LABELS.map((d) => {
              const s = STATUS[summary.domains[d.key]];
              return (
                <li key={d.key} className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {d.label}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <Skeleton />
      )}

      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent-env">
        Enter station
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
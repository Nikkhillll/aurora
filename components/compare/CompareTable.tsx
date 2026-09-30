import { Building2, Gauge, Truck, Zap, type LucideIcon } from "lucide-react";

import StatusPill, { STATUS_META } from "@/components/station/StatusPill";
import type { CompareData } from "@/lib/stationCompare";
import type { StationKey } from "@/lib/stationClient";

interface Row {
  label: string;
  value: (s: CompareData) => { text: string; pct?: number };
}

interface Group {
  title: string;
  icon: LucideIcon;
  accent: string;
  domain: keyof CompareData["domains"];
  rows: Row[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const GROUPS: Group[] = [
  {
    title: "Environment",
    icon: Gauge,
    accent: "#4CC9F0",
    domain: "env",
    rows: [
      { label: "Temperature", value: (s) => ({ text: `${s.temperatureC.toFixed(1)} °C` }) },
      { label: "Wind speed", value: (s) => ({ text: `${s.windKmh.toFixed(0)} km/h` }) },
      { label: "Pressure", value: (s) => ({ text: `${s.pressureHpa.toFixed(0)} hPa` }) },
      { label: "Weather risk", value: (s) => ({ text: cap(s.weatherRisk) }) },
      { label: "Cold exposure", value: (s) => ({ text: cap(s.coldRisk) }) },
    ],
  },
  {
    title: "Energy",
    icon: Zap,
    accent: "#FFB84D",
    domain: "power",
    rows: [
      {
        label: "Battery",
        value: (s) => ({ text: `${s.batteryPct.toFixed(0)}%`, pct: s.batteryPct }),
      },
      { label: "Generation", value: (s) => ({ text: `${s.generationKw.toFixed(1)} kW` }) },
      {
        label: "Reserve",
        value: (s) => ({
          text: s.hoursRemaining != null ? `${s.hoursRemaining.toFixed(0)} h` : "n/a",
        }),
      },
      { label: "Generator", value: (s) => ({ text: s.generator }) },
    ],
  },
  {
    title: "Infrastructure",
    icon: Building2,
    accent: "#34D399",
    domain: "struct",
    rows: [
      {
        label: "Equipment health",
        value: (s) => ({ text: `${s.equipmentHealth.toFixed(0)}%`, pct: s.equipmentHealth }),
      },
      { label: "Building condition", value: (s) => ({ text: s.buildingCondition }) },
    ],
  },
  {
    title: "Logistics",
    icon: Truck,
    accent: "#8592A3",
    domain: "logistics",
    rows: [
      { label: "Fuel", value: (s) => ({ text: `${s.fuelPct.toFixed(0)}%`, pct: s.fuelPct }) },
      {
        label: "Supplies",
        value: (s) => ({ text: `${s.suppliesPct.toFixed(0)}%`, pct: s.suppliesPct }),
      },
      { label: "Spare parts", value: (s) => ({ text: String(s.spareParts) }) },
      { label: "Next resupply", value: (s) => ({ text: s.resupply }) },
    ],
  },
];

function Bar({ value }: { value: number }) {
  const color = value < 30 ? "#F5484F" : value < 50 ? "#F5A524" : "#34D399";
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-1.5 h-1.5 w-full max-w-36 rounded-full bg-border/50">
      <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  );
}

export default function CompareTable({
  order,
  data,
}: {
  order: StationKey[];
  data: Record<StationKey, CompareData>;
}) {
  const cols = order.map((k) => data[k]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
      <table className="w-full min-w-130 text-left">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="w-[30%] p-4 text-xs font-normal uppercase tracking-widest text-text-muted">
              Metric
            </th>
            {cols.map((s) => (
              <th key={s.id} scope="col" className="p-4 align-top">
                <p className="text-lg font-semibold text-text-primary">{s.name}</p>
                <p className="mt-0.5 font-mono text-xs font-normal text-text-muted">{s.coordinates}</p>
                <div className="mt-2">
                  <StatusPill status={s.overall} />
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <tbody key={g.title} className="border-t border-border">
              <tr className="bg-bg-base/50">
                <th scope="rowgroup" className="p-4 text-left">
                  <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Icon size={16} style={{ color: g.accent }} />
                    {g.title}
                  </span>
                </th>
                {cols.map((s) => {
                  const m = STATUS_META[s.domains[g.domain]];
                  return (
                    <td key={s.id} className="p-4">
                      <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: m.color }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                        {m.label}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {g.rows.map((r) => (
                <tr key={r.label} className="border-t border-border/60">
                  <th scope="row" className="px-4 py-3 text-sm font-normal text-text-muted">
                    {r.label}
                  </th>
                  {cols.map((s) => {
                    const v = r.value(s);
                    return (
                      <td key={s.id} className="px-4 py-3">
                        <p className="font-mono text-sm text-text-primary">{v.text}</p>
                        {v.pct !== undefined && <Bar value={v.pct} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
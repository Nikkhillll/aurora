"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Status } from "@/lib/stationSummary";
import "./twin.css";
import { useStation } from "./StationProvider";
import { getSafetyStatus } from "./safetyStatus";
import StatusPill, { STATUS_META } from "./StatusPill";

type ZoneId = "quarters" | "power" | "lab" | "fuel" | "weather";

interface Zone {
  id: ZoneId;
  name: string;
  status: Status;
  metric: string;
  facts: string[];
  href: string;
  linkLabel: string;
}

// Layout in a 620 x 340 viewBox. Illustrative, not to scale.
const GEO = {
  quarters: { x: 50, y: 130, w: 190, h: 120 },
  power: { x: 285, y: 60, w: 140, h: 90 },
  lab: { x: 285, y: 205, w: 140, h: 90 },
  fuel: { x: 470, y: 215, w: 110, h: 80 },
} as const;
const MAST = { cx: 525, cy: 105, r: 40 };

const RANK: Record<Status, number> = { nominal: 0, warning: 1, critical: 2 };

// Wind streak start positions across the ground plane.
const STREAKS: [number, number][] = [
  [40, 90],
  [150, 40],
  [260, 30],
  [400, 170],
  [80, 290],
  [330, 310],
  [560, 190],
];

export default function StationTwin() {
  const d = useStation();
  const [selected, setSelected] = useState<ZoneId | null>(null);

  const safety = getSafetyStatus(d.env.temperature, d.env.wind, d.personnel.heatingStatus);
  const base = `/station/${d.key}`;

  const zones: Zone[] = [
    {
      id: "quarters",
      name: "Living quarters",
      status: safety.status,
      metric: `${d.personnel.onSite} on site`,
      facts: [
        `${d.personnel.onSite} of ${d.personnel.totalPersonnel} personnel on site`,
        `Heating ${d.personnel.heatingStatus}`,
        `Cold exposure ${safety.coldRisk.toLowerCase()}`,
      ],
      href: `${base}/safety`,
      linkLabel: "Open safety",
    },
    {
      id: "power",
      name: "Power house",
      status: d.domains.power,
      metric: `${d.energy.batteryLevel.toFixed(0)}%`,
      facts: [
        `Battery ${d.energy.batteryLevel.toFixed(0)}%`,
        `Generation ${d.energy.solarGeneration.toFixed(1)} kW`,
        `Generator ${d.energy.generatorStatus.toLowerCase()}`,
        ...(d.hoursRemaining != null ? [`${d.hoursRemaining.toFixed(0)} h reserve`] : []),
      ],
      href: `${base}/energy`,
      linkLabel: "Open energy",
    },
    {
      id: "lab",
      name: "Research lab",
      status: d.domains.struct,
      metric: `${d.infra.equipmentHealth.toFixed(0)}%`,
      facts: [
        `Equipment health ${d.infra.equipmentHealth.toFixed(0)}%`,
        `Building ${d.infra.buildingCondition.toLowerCase()}`,
        `Sensors ${d.infra.sensorStatus}%`,
      ],
      href: `${base}/infrastructure`,
      linkLabel: "Open infrastructure",
    },
    {
      id: "fuel",
      name: "Fuel store",
      status: d.domains.logistics,
      metric: `${d.logistics.fuelLevel.toFixed(0)}%`,
      facts: [
        `Fuel ${d.logistics.fuelLevel.toFixed(0)}%`,
        `Resupply ${d.logistics.resupplyWindow}`,
      ],
      href: `${base}/logistics`,
      linkLabel: "Open logistics",
    },
    {
      id: "weather",
      name: "Weather",
      status: d.domains.env,
      metric: `${d.env.temperature.toFixed(0)}°C`,
      facts: [
        `Temperature ${d.env.temperature.toFixed(1)} °C`,
        `Wind ${d.env.wind.toFixed(0)} km/h`,
        `Pressure ${d.env.pressure.toFixed(0)} hPa`,
        `Risk ${d.env.weatherRisk.toLowerCase()}`,
      ],
      href: `${base}/environment`,
      linkLabel: "Open environment",
    },
  ];

  // Default to the worst zone so the panel opens on what matters most.
  const worst = zones.reduce((a, b) => (RANK[b.status] > RANK[a.status] ? b : a));
  const active = zones.find((z) => z.id === (selected ?? worst.id)) ?? worst;

  const stormy = d.domains.env !== "nominal";
  const stormColor = STATUS_META[d.domains.env].color;
  const windDuration = Math.max(1.2, 5 - d.env.wind / 15);

  const onKey = (e: KeyboardEvent, id: ZoneId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(id);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base text-text-muted">Station twin</h2>
          <p className="text-xs text-text-muted">Select a zone for details</p>
        </div>
        <ul className="flex gap-3 text-xs text-text-muted">
          {(["nominal", "warning", "critical"] as Status[]).map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_META[s].color }}
              />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <svg
        viewBox="0 0 620 340"
        className="h-auto w-full"
        role="group"
        aria-label={`Schematic of ${d.station.name} station with zone status`}
      >
        <defs>
          <pattern
            id="twin-hatch"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke={stormColor} strokeWidth="2" strokeOpacity="0.12" />
          </pattern>
        </defs>

        {/* Ground plane */}
        <rect x="10" y="10" width="600" height="320" rx="24" fill="rgba(133,146,163,0.06)" stroke="rgba(133,146,163,0.22)" />
        <ellipse cx="310" cy="170" rx="270" ry="140" fill="none" stroke="rgba(133,146,163,0.10)" />
        <ellipse cx="310" cy="170" rx="200" ry="100" fill="none" stroke="rgba(133,146,163,0.08)" />
        {stormy && <rect x="10" y="10" width="600" height="320" rx="24" fill="url(#twin-hatch)" />}

        {/* Corridors */}
        <g stroke="rgba(133,146,163,0.45)" strokeWidth="2" strokeDasharray="5 5" fill="none">
          <path d="M240 190 H262 V105 H285" />
          <path d="M262 190 V250 H285" />
          <path d="M355 150 V205" />
          <path d="M425 250 H470" />
          <path d="M425 105 H485" />
        </g>

        {/* Wind */}
        <text x="34" y="44" fontSize="14" fill="rgba(133,146,163,0.95)" fontFamily="monospace">
          Wind {d.env.wind.toFixed(0)} km/h
        </text>
        <path
          d="M34 62 h46 m-9 -7 l9 7 l-9 7"
          fill="none"
          stroke="rgba(133,146,163,0.95)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <g style={{ opacity: stormy ? 0.9 : 0.4 }}>
          {STREAKS.map(([x, y], i) => (
            <line
              key={i}
              className="twin-streak"
              x1={x}
              y1={y}
              x2={x + 24}
              y2={y + 10}
              stroke={stormy ? stormColor : "#8592A3"}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ animationDuration: `${windDuration}s`, animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </g>

        {/* Zones */}
        {zones.map((z) => {
          const s = STATUS_META[z.status];
          const isActive = z.id === active.id;
          const fill = `${s.color}${isActive ? "38" : "1F"}`;

          let cx: number;
          let cy: number;
          let dotX: number;
          let dotY: number;
          let shape;

          if (z.id === "weather") {
            cx = MAST.cx;
            cy = MAST.cy;
            dotX = MAST.cx + 28;
            dotY = MAST.cy - 28;
            shape = (
              <>
                <circle
                  className="twin-shape"
                  cx={cx}
                  cy={cy}
                  r={MAST.r}
                  fill={fill}
                  stroke={s.color}
                  strokeWidth={isActive ? 3.5 : 2}
                />
                <line x1={cx} y1={cy - MAST.r} x2={cx} y2={cy - MAST.r - 16} stroke={s.color} strokeWidth="2" />
                <circle cx={cx} cy={cy - MAST.r - 18} r="3" fill={s.color} />
              </>
            );
          } else {
            const g = GEO[z.id];
            cx = g.x + g.w / 2;
            cy = g.y + g.h / 2;
            dotX = g.x + g.w - 14;
            dotY = g.y + 14;
            shape = (
              <rect
                className="twin-shape"
                x={g.x}
                y={g.y}
                width={g.w}
                height={g.h}
                rx="14"
                fill={fill}
                stroke={s.color}
                strokeWidth={isActive ? 3.5 : 2}
              />
            );
          }

          return (
            <g
              key={z.id}
              className="twin-zone"
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`${z.name}, ${s.label.toLowerCase()}, ${z.metric}`}
              onClick={() => setSelected(z.id)}
              onKeyDown={(e) => onKey(e, z.id)}
            >
              {shape}
              <text x={cx} y={cy - 2} textAnchor="middle" fontSize="15" fontWeight="600" fill="#E6EDF7">
                {z.name}
              </text>
              <text x={cx} y={cy + 20} textAnchor="middle" fontSize="14" fill={s.color} fontFamily="monospace">
                {z.metric}
              </text>
              {z.status !== "nominal" && (
                <circle className="twin-pulse" cx={dotX} cy={dotY} r="5" fill={s.color} />
              )}
              <circle cx={dotX} cy={dotY} r="5" fill={s.color} />
            </g>
          );
        })}
      </svg>

      {/* Selected zone details */}
      <div
        aria-live="polite"
        className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-bg-base/60 p-4"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-medium text-text-primary">{active.name}</h3>
            <StatusPill status={active.status} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-muted">
            {active.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <Link
          href={active.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-env"
        >
          {active.linkLabel}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
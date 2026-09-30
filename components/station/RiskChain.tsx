"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Status } from "@/lib/stationSummary";
import { useStation } from "./StationProvider";
import { getSafetyStatus } from "./safetyStatus";
import { STATUS_META } from "./StatusPill";

export default function RiskChain() {
  const d = useStation();
  const base = `/station/${d.key}`;
  const safety = getSafetyStatus(d.env.temperature, d.env.wind, d.personnel.heatingStatus);

  // Weather drives power, power drives supply pressure, and all of it lands on people.
  const chain: { label: string; status: Status; href: string }[] = [
    { label: "Environment", status: d.domains.env, href: `${base}/environment` },
    { label: "Energy", status: d.domains.power, href: `${base}/energy` },
    { label: "Logistics", status: d.domains.logistics, href: `${base}/logistics` },
    { label: "Safety", status: safety.status, href: `${base}/safety` },
  ];

  const start = chain.findIndex((n) => n.status !== "nominal");
  const downstream = start === -1 ? [] : chain.slice(start + 1).map((n) => n.label);

  let caption: string;
  if (start === -1) {
    caption = "No cascade risk detected. Every link in the chain is nominal.";
  } else {
    const first = chain[start];
    caption = `${first.label} is ${first.status}.`;
    if (downstream.length > 0) caption += ` Downstream to watch: ${downstream.join(", ")}.`;
  }

  return (
    <section className="rounded-xl border border-border bg-bg-card p-5">
      <h2 className="text-base text-text-muted">Cascade watch</h2>

      {/* 2 columns on phones, one row of 4 with arrows from `sm` up */}
      <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
        {chain.map((n, i) => {
          const s = STATUS_META[n.status];
          return (
            <li key={n.label} className="relative">
              <Link
                href={n.href}
                className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm text-text-primary transition-opacity hover:opacity-80"
                style={{ borderColor: `${s.color}66`, backgroundColor: `${s.color}14` }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate">{n.label}</span>
                <span className="sr-only">, {s.label.toLowerCase()}</span>
              </Link>

              {i < chain.length - 1 && (
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className="absolute left-full top-1/2 ml-1.25 hidden -translate-y-1/2 sm:block"
                  style={{ color: n.status !== "nominal" ? s.color : "#8592A3" }}
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-sm text-text-muted">{caption}</p>
    </section>
  );
}
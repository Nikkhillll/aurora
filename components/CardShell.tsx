import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import StatusPill from "@/components/station/StatusPill";
import type { Status } from "@/lib/stationSummary";

/** Shared card anatomy: tinted icon + title on the left, optional status pill on the right. */
export default function CardShell({
  icon: Icon,
  title,
  accent,
  status,
  children,
}: {
  icon: LucideIcon;
  title: string;
  accent: string;
  status?: Status;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-5 rounded-xl border border-border bg-bg-card p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}1F` }}
          >
            <Icon size={18} style={{ color: accent }} />
          </span>
          <h2 className="text-base font-medium text-text-primary">{title}</h2>
        </div>
        {status && <StatusPill status={status} />}
      </header>
      {children}
    </section>
  );
}

/** Loading / error / empty message inside a card. */
export function CardMessage({
  children,
  tone = "muted",
  pulse = false,
}: {
  children: ReactNode;
  tone?: "muted" | "error";
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <p
        role={tone === "error" ? "alert" : undefined}
        className={`font-mono text-sm ${tone === "error" ? "text-status-critical" : "text-text-muted"} ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        {children}
      </p>
    </div>
  );
}

/** Small coloured status pill. */
export function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium"
      style={{ color, backgroundColor: `${color}14`, borderColor: `${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

/** Bordered readout tile. */
export function Tile({
  icon: Icon,
  label,
  accent,
  className = "",
  children,
}: {
  icon?: LucideIcon;
  label: string;
  accent?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-border bg-bg-base/60 p-3 ${className}`}>
      <p className="flex items-center gap-1.5 text-xs text-text-muted">
        {Icon && <Icon size={13} style={{ color: accent }} />}
        {label}
      </p>
      <div className="mt-1.5 flex min-h-7 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Big monospace number with an optional unit. */
export function Value({
  children,
  unit,
  color,
}: {
  children: ReactNode;
  unit?: string;
  color?: string;
}) {
  return (
    <p className="font-mono text-xl text-text-primary" style={color ? { color } : undefined}>
      {children}
      {unit && <span className="ml-1 text-sm text-text-muted">{unit}</span>}
    </p>
  );
}
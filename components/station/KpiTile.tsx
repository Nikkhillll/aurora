import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Status } from "@/lib/stationSummary";
import { STATUS_META } from "./StatusPill";

export default function KpiTile({
  href,
  icon: Icon,
  label,
  value,
  unit,
  sub,
  status,
  accent,
  className = "",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  status: Status;
  accent: string;
  className?: string;
}) {
  const s = STATUS_META[status];

  return (
    <Link
      href={href}
      className={`group flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 transition-colors hover:border-accent-env/40 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm text-text-muted">
          <Icon size={16} className="shrink-0" style={{ color: accent }} />
          <span className="truncate">{label}</span>
        </span>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: s.color }}
          title={s.label}
        >
          <span className="sr-only">{s.label}</span>
        </span>
      </div>

      <p className="flex flex-wrap items-baseline gap-x-1.5 font-mono text-3xl text-text-primary">
        <span>{value}</span>
        {unit && <span className="whitespace-nowrap text-sm text-text-muted">{unit}</span>}
      </p>

      <p className="text-xs leading-relaxed text-text-muted">{sub}</p>
    </Link>
  );
}
import type { Status } from "@/lib/stationSummary";

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  nominal: { label: "NOMINAL", color: "#34D399" },
  warning: { label: "WARNING", color: "#F5A524" },
  critical: { label: "CRITICAL", color: "#F5484F" },
};

export default function StatusPill({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs"
      style={{ color: m.color, backgroundColor: `${m.color}14`, borderColor: `${m.color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}
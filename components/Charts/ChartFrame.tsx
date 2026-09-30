import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared frame for the trend charts: same header style as the domain cards,
 * and a body that stretches to fill the card so there is no dead space.
 */
export default function ChartFrame({
  icon: Icon,
  title,
  accent,
  stationName,
  live = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  accent: string;
  stationName: string;
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex h-full flex-col gap-4 rounded-xl border border-border bg-bg-card p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}1F` }}
          >
            <Icon size={18} style={{ color: accent }} />
          </span>
          <h3 className="text-base font-medium text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {live && <span className="font-mono text-xs text-status-nominal">● live</span>}
          <span className="font-mono text-sm text-text-muted">{stationName}</span>
        </div>
      </header>

      <div className="relative min-h-56 flex-1">
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      </div>
    </section>
  );
}
// Placeholder — Person 5 will build this component
import type { Alert } from "@/data/mockData";

interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-3">
      <h2 className="text-sm text-text-muted font-sans">Alerts</h2>
      <p className="text-xs text-text-muted">Awaiting implementation</p>
    </div>
  );
}

// Placeholder — Person 3 will build this component
import type { LogisticsData } from "@/data/mockData";

interface LogisticsCardProps {
  data: LogisticsData;
}

export default function LogisticsCard({ data }: LogisticsCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-3">
      <h2 className="text-sm text-text-muted font-sans">Logistics</h2>
      <p className="text-xs text-text-muted">Awaiting implementation</p>
    </div>
  );
}

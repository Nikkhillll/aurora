// Placeholder — Person 3 will build this component
import type { InfrastructureData } from "@/data/mockData";

interface InfrastructureCardProps {
  data: InfrastructureData;
}

export default function InfrastructureCard({ data }: InfrastructureCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-3">
      <h2 className="text-sm text-text-muted font-sans">Infrastructure</h2>
      <p className="text-xs text-text-muted">Awaiting implementation</p>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Gauge, Zap, Building2, Truck } from "lucide-react";
import AuroraBackground from "./AuroraBackground";

// Static preview of the dashboard — purely illustrative, no live data.
function PreviewTile({
  icon: Icon,
  label,
  value,
  unit,
  color,
  status,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  unit: string;
  color: string;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-base/60 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Icon size={13} style={{ color }} />
          {label}
        </div>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status }} />
      </div>
      <p className="mt-2 font-mono text-2xl text-text-primary">
        {value}
        <span className="ml-1 text-xs text-text-muted">{unit}</span>
      </p>
      <svg viewBox="0 0 100 24" className="mt-2 h-6 w-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points="0,18 14,15 28,17 42,10 56,12 70,6 84,9 100,4"
        />
      </svg>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="fade-up fade-up-4 mx-auto mt-14 max-w-4xl rounded-2xl border border-border bg-bg-card/80 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Station</p>
          <p className="font-mono text-base text-text-primary">Maitri · 70.766°S 11.731°E</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-status-warning/30 bg-status-warning/10 px-2.5 py-0.5 font-mono text-xs text-status-warning">
            WARNING
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs text-status-nominal">
            <span className="live-dot h-2 w-2 rounded-full bg-status-nominal" />
            LIVE
          </span>
        </div>
      </div>

      <p className="py-3 text-left text-sm text-text-muted">
        Storm expected in 6h. Battery endurance projected to drop to{" "}
        <span className="font-mono text-text-primary">9h</span>.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PreviewTile icon={Gauge} label="Environment" value="-32" unit="°C" color="#4CC9F0" status="#F5A524" />
        <PreviewTile icon={Zap} label="Energy" value="62" unit="%" color="#FFB84D" status="#F5A524" />
        <PreviewTile icon={Building2} label="Infrastructure" value="91" unit="%" color="#34D399" status="#34D399" />
        <PreviewTile icon={Truck} label="Logistics" value="48" unit="% fuel" color="#8592A3" status="#34D399" />
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <p className="fade-up mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card/70 px-3 py-1 text-xs text-text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-env" />
          Smart India Hackathon 2026 · SIH26060 · MoES / NCPOR
        </p>

        <h1 className="fade-up fade-up-2 mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-text-primary sm:text-6xl">
          One digital twin for{" "}
          <span className="bg-linear-to-r from-accent-env to-[#7c5cff] bg-clip-text text-transparent">
            Antarctic operations
          </span>
        </h1>

        <p className="fade-up fade-up-3 mx-auto mt-5 max-w-2xl text-base text-text-muted sm:text-lg">
          AURORA unifies environment, energy, infrastructure and logistics for Maitri and Bharati
          stations, predicts cascading risk, and lets operators simulate decisions before making them.
        </p>

        <div className="fade-up fade-up-3 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-env px-5 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
          >
            Launch dashboard
            <ArrowRight size={16} />
          </Link>
          <a
            href="#how"
            className="rounded-lg border border-border bg-bg-card/60 px-5 py-2.5 text-sm text-text-primary transition-colors hover:bg-border/50"
          >
            See how it works
          </a>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
import { Unplug, Layers } from "lucide-react";

export default function ProblemSolution() {
  return (
    <section id="problem" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-accent-env">The challenge</p>
        <h2 className="mt-2 text-3xl font-semibold text-text-primary">
          Remote stations, fragmented visibility
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-status-critical/10">
            <Unplug size={20} className="text-status-critical" />
          </div>
          <h3 className="text-lg font-medium text-text-primary">Today</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Environment, energy, infrastructure and logistics data live in separate systems. Operators
            piece together the picture by hand, and a storm is treated as just bad weather, not as a
            chain reaction.
          </p>
        </div>

        <div className="rounded-xl border border-accent-env/30 bg-bg-card p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-env/10">
            <Layers size={20} className="text-accent-env" />
          </div>
          <h3 className="text-lg font-medium text-text-primary">With AURORA</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            One operational picture per station. A storm becomes projected battery drain, resupply
            pressure and equipment strain, all connected, forecast in advance and ready to simulate.
          </p>
        </div>
      </div>
    </section>
  );
}
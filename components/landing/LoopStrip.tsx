import { Eye, Brain, SlidersHorizontal, Lightbulb, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Eye, title: "Observe", text: "Real-time and historical telemetry from every domain." },
  { icon: Brain, title: "Predict", text: "ML forecasts for weather risk and energy endurance." },
  { icon: SlidersHorizontal, title: "Simulate", text: "What-if scenarios: storm, equipment failure, resupply delay." },
  { icon: Lightbulb, title: "Recommend", text: "Severity-ranked alerts with suggested actions." },
  { icon: CheckCircle2, title: "Act", text: "Operations teams respond with confidence." },
];

export default function LoopStrip() {
  return (
    <section id="how" className="border-y border-border bg-bg-card/40 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-accent-energy">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold text-text-primary">
            From reactive monitoring to proactive operations
          </h2>
        </div>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-xl border border-border bg-bg-card p-5">
              <span className="absolute right-4 top-4 font-mono text-xs text-text-muted">
                0{i + 1}
              </span>
              <s.icon size={22} className="text-accent-env" />
              <h3 className="mt-4 text-base font-medium text-text-primary">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
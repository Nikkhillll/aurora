import { Gauge, Zap, Building2, Truck, ShieldCheck, SlidersHorizontal } from "lucide-react";

const domains = [
  {
    icon: Gauge,
    color: "#4CC9F0",
    title: "Environment",
    text: "Temperature, pressure and wind with a live weather-risk rating.",
  },
  {
    icon: Zap,
    color: "#FFB84D",
    title: "Energy",
    text: "Battery, generation, consumption and projected hours remaining.",
  },
  {
    icon: Building2,
    color: "#34D399",
    title: "Infrastructure",
    text: "Equipment health, building condition and zone-by-zone status.",
  },
  {
    icon: Truck,
    color: "#8592A3",
    title: "Logistics",
    text: "Fuel, supplies, spare parts and the resupply route countdown.",
  },
  {
    icon: ShieldCheck,
    color: "#F5A524",
    title: "Personnel safety",
    text: "Headcount, heating status and cold-exposure risk.",
  },
  {
    icon: SlidersHorizontal,
    color: "#7C5CFF",
    title: "What-if simulator",
    text: "Adjust scenario severity and see the cascade before it happens.",
  },
];

export default function DomainGrid() {
  return (
    <section id="domains" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-accent-env">What you get</p>
        <h2 className="mt-2 text-3xl font-semibold text-text-primary">
          Every operational domain, in one place
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((d) => (
          <div
            key={d.title}
            className="group rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-border hover:bg-[#182130]"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${d.color}1A` }}
            >
              <d.icon size={20} style={{ color: d.color }} />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">{d.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{d.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
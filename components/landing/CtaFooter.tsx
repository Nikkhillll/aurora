import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaFooter() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-bg-card p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold text-text-primary sm:text-3xl">
            Ready to see Maitri and Bharati live?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted sm:text-base">
            Open the dashboard, watch the telemetry, and run a storm scenario yourself.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-env px-5 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
          >
            Launch dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-mono tracking-widest text-text-primary">AURORA</p>
          <p>Antarctic Unified Operations &amp; Risk Analytics · SIH26060 · MoES / NCPOR</p>
          <p>Team ASTRA MeridianX</p>
        </div>
      </footer>
    </>
  );
}
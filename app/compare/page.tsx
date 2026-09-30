"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, LogOut } from "lucide-react";

import CompareTable from "@/components/compare/CompareTable";
import StatusPill, { STATUS_META } from "@/components/station/StatusPill";
import { clearSession, getStoredUser, type User } from "@/lib/authClient";
import { stationHref } from "@/lib/routes";
import { homeFor } from "@/lib/stationAccess";
import { fetchStationCompare, type CompareData } from "@/lib/stationCompare";
import type { StationKey } from "@/lib/stationClient";
import { STATION_KEYS, type Status } from "@/lib/stationSummary";

type Data = Partial<Record<StationKey, CompareData>>;

const RANK: Record<Status, number> = { nominal: 0, warning: 1, critical: 2 };
const DOMAIN_LABEL: Record<keyof CompareData["domains"], string> = {
  env: "Environment",
  power: "Energy",
  struct: "Infrastructure",
  logistics: "Logistics",
};

function attentionText(a: CompareData, b: CompareData): string {
  const sameStatus = RANK[a.overall] === RANK[b.overall];
  if (sameStatus && a.alertCount === b.alertCount) {
    return a.overall === "nominal"
      ? "Both stations are nominal."
      : `Both stations are at ${a.overall} with the same number of alerts.`;
  }

  const first =
    RANK[a.overall] !== RANK[b.overall]
      ? RANK[a.overall] > RANK[b.overall]
        ? a
        : b
      : a.alertCount > b.alertCount
        ? a
        : b;
  const other = first === a ? b : a;

  const flagged = (Object.keys(first.domains) as (keyof CompareData["domains"])[])
    .filter((k) => first.domains[k] !== "nominal")
    .map((k) => `${DOMAIN_LABEL[k]} ${first.domains[k]}`);

  if (flagged.length === 0) {
    return `${first.name} has more active alerts (${first.alertCount} vs ${other.alertCount}).`;
  }
  return `${first.name} needs attention first: ${flagged.join(", ")}. ${first.alertCount} active alert${
    first.alertCount === 1 ? "" : "s"
  } vs ${other.alertCount} at ${other.name}.`;
}

export default function ComparePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Data>({});

  // Admin-only guard.
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    if (stored.role !== "admin") {
      router.replace(homeFor(stored));
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(stored);
  }, [router]);

  // Load both stations, refresh every 10s.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const results = await Promise.all(STATION_KEYS.map((k) => fetchStationCompare(k)));
      if (cancelled) return;
      setData(Object.fromEntries(results.map((r) => [r.id, r])) as Data);
    };

    void load();
    const interval = setInterval(() => void load(), 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  const ready = STATION_KEYS.every((k) => data[k]);
  const anyLive = STATION_KEYS.some((k) => data[k]?.live);
  const complete = ready ? (data as Record<StationKey, CompareData>) : null;

  return (
    <div className="flex-1">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-env" />
            <span className="font-mono text-sm font-semibold tracking-[0.25em] text-text-primary">
              AURORA
            </span>
          </Link>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-2.5 py-1 text-xs">
            <span className="text-text-primary">{user.name}</span>
            <span className="rounded bg-border/50 px-1.5 font-mono text-[11px] uppercase text-text-muted">
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="ml-1 cursor-pointer text-text-muted transition-colors hover:text-status-critical"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/stations"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          Back to stations
        </Link>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent-env">Administrator</p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">Compare stations</h1>
            <p className="mt-1 text-sm text-text-muted">Maitri and Bharati side by side.</p>
          </div>
          {ready && (
            <span className={`font-mono text-xs ${anyLive ? "text-status-nominal" : "text-text-muted"}`}>
              {anyLive ? "● LIVE DATA" : "○ SAMPLE DATA (backend offline)"}
            </span>
          )}
        </div>

        {!complete ? (
          <div className="flex animate-pulse flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-36 rounded-2xl bg-border/40" />
              <div className="h-36 rounded-2xl bg-border/40" />
            </div>
            <div className="h-16 rounded-xl bg-border/40" />
            <div className="h-96 rounded-2xl bg-border/40" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {STATION_KEYS.map((k) => {
                const s = complete[k];
                return (
                  <Link
                    key={k}
                    href={stationHref(k)}
                    className="group flex flex-col gap-3 rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-accent-env/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-text-primary">{s.name}</h2>
                        <p className="mt-0.5 font-mono text-xs text-text-muted">{s.coordinates}</p>
                      </div>
                      <StatusPill status={s.overall} />
                    </div>
                    <p className="text-sm text-text-muted">
                      {s.alertCount} active alert{s.alertCount === 1 ? "" : "s"}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent-env">
                      Enter station
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Which needs attention first */}
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-border bg-bg-card p-4"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
                style={{
                  color:
                    STATUS_META[
                      RANK[complete.maitri.overall] >= RANK[complete.bharati.overall]
                        ? complete.maitri.overall
                        : complete.bharati.overall
                    ].color,
                }}
              />
              <p className="text-sm text-text-primary">
                {attentionText(complete.maitri, complete.bharati)}
              </p>
            </div>

            <CompareTable order={STATION_KEYS} data={complete} />
          </div>
        )}
      </main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, ArrowRight, LogOut, Shield } from "lucide-react";

import StationCard from "@/components/stations/StationCard";
import { stations } from "@/data/mockData";
import { clearSession, getStoredUser, type User } from "@/lib/authClient";
import { allowedStations, homeFor } from "@/lib/stationAccess";
import {
  fetchStationSummary,
  STATION_KEYS,
  type StationSummary,
} from "@/lib/stationSummary";
import type { StationKey } from "@/lib/stationClient";

type Summaries = Partial<Record<StationKey, StationSummary>>;

const ADMIN_FEATURES = ["Users & roles", "Access control", "Audit log"];

export default function StationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [summaries, setSummaries] = useState<Summaries>({});

  // Guard: no session → login. Single-station users skip this page entirely.
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    const home = homeFor(stored);
    if (home !== "/stations") {
      router.replace(home);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(stored);
  }, [router]);

  // Load stations, then refresh every 10s.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const results = await Promise.all(STATION_KEYS.map((k) => fetchStationSummary(k)));
      if (cancelled) return;
      setSummaries(Object.fromEntries(results.map((r) => [r.id, r])) as Summaries);
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

  const isAdmin = user.role === "admin";
  const allowed = allowedStations(user);
  const anyLive = Object.values(summaries).some((s) => s?.live);
  const loaded = Object.keys(summaries).length > 0;

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

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* ── 1. Admin controls come first ── */}
        {isAdmin && (
          <section className="mb-10 rounded-2xl border border-accent-env/30 bg-bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent-env/10">
                  <Shield size={28} className="text-accent-env" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent-env">
                    Administrator controls
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-text-primary">Admin console</h2>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">
                    Create and manage operator accounts, change roles, activate or deactivate
                    access, and review the audit trail.
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {ADMIN_FEATURES.map((f) => (
                      <li
                        key={f}
                        className="rounded-full border border-border bg-bg-base/60 px-2.5 py-0.5 text-xs text-text-muted"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-env px-5 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
              >
                Open admin console
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}

        {/* ── 2. Stations ── */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent-env">
              {isAdmin ? "Stations" : "Your stations"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-text-primary">Select a station</h1>
            <p className="mt-1 text-sm text-text-muted">
              Choose which Indian Antarctic research station to monitor.
            </p>
          </div>

          {loaded && (
            <span
              className={`font-mono text-xs ${anyLive ? "text-status-nominal" : "text-text-muted"}`}
            >
              {anyLive ? "● LIVE DATA" : "○ SAMPLE DATA (backend offline)"}
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {stations
            .filter((s) => allowed.includes(s.id as StationKey))
            .map((s) => (
              <StationCard key={s.id} station={s} summary={summaries[s.id as StationKey] ?? null} />
            ))}
        </div>

        {/* ── 3. Compare (admin only) ── */}
        {isAdmin && (
          <Link
            href="/compare"
            className="group mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-accent-env/40"
          >
            <div className="flex items-center gap-3">
              <ArrowLeftRight size={20} className="text-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">Compare stations</p>
                <p className="text-xs text-text-muted">Maitri and Bharati side by side</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-env">
              Open comparison
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        )}
      </main>
    </div>
  );
}
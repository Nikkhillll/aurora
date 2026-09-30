"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import Notifications from "@/components/Notifications";
import type { User } from "@/lib/authClient";
import type { StationKey } from "@/lib/stationClient";
import { stations } from "@/data/mockData";
import { useStation } from "./StationProvider";
import ReportsMenu from "./ReportsMenu";

export default function TopBar({
  user,
  allowed,
  onMenu,
  onLogout,
}: {
  user: User;
  allowed: StationKey[];
  onMenu: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const { key, station, live, ready } = useStation();
  const [utc, setUtc] = useState("");

  useEffect(() => {
    const tick = () => setUtc(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Same page, other station.
  const hrefFor = (id: string) => pathname.replace(/^\/station\/[^/]+/, `/station/${id}`);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg-base/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="cursor-pointer text-text-muted hover:text-text-primary lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Station switcher (only for users with more than one station) */}
        {allowed.length > 1 ? (
          <div
            className="flex rounded-lg border border-border bg-bg-card p-0.5"
            role="tablist"
            aria-label="Station"
          >
            {stations
              .filter((s) => allowed.includes(s.id as StationKey))
              .map((s) => (
                <Link
                  key={s.id}
                  href={hrefFor(s.id)}
                  role="tab"
                  aria-selected={key === s.id}
                  className={`rounded-md px-3 py-1 font-mono text-sm transition-colors ${
                    key === s.id
                      ? "bg-border/70 text-text-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {s.name}
                </Link>
              ))}
          </div>
        ) : (
          <span className="rounded-lg border border-border bg-bg-card px-3 py-1.5 font-mono text-sm text-text-primary">
            {station.name}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="font-mono text-xs text-text-muted">{utc}</p>
            <p
              className={`font-mono text-xs ${live ? "text-status-nominal" : "text-text-muted"}`}
              title={live ? "Receiving live telemetry" : "Backend offline. Showing sample data."}
            >
              {!ready ? "… CONNECTING" : live ? "● LIVE" : "○ SAMPLE DATA"}
            </p>
          </div>

          <ReportsMenu />
          <Notifications stationId={key} />

          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-2.5 py-1 text-xs">
            <span className="hidden text-text-primary md:inline">{user.name.split(" ")[0]}</span>
            <span className="rounded bg-border/50 px-1.5 font-mono text-xs uppercase text-text-muted">
              {user.role}
            </span>
            <button
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="cursor-pointer text-text-muted transition-colors hover:text-status-critical"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  Building2,
  Gauge,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  X,
  Zap,
} from "lucide-react";

import { useStation } from "./StationProvider";
import StatusPill, { STATUS_META } from "./StatusPill";

const NAV = [
  { label: "Overview", path: "", icon: LayoutDashboard },
  { label: "Environment", path: "/environment", icon: Gauge, domain: "env" },
  { label: "Energy", path: "/energy", icon: Zap, domain: "power" },
  { label: "Infrastructure", path: "/infrastructure", icon: Building2, domain: "struct" },
  { label: "Logistics", path: "/logistics", icon: Truck, domain: "logistics" },
  { label: "Safety", path: "/safety", icon: ShieldCheck },
  { label: "Alerts", path: "/alerts", icon: Bell, alertsBadge: true },
  { label: "Simulate", path: "/simulate", icon: SlidersHorizontal },
] as const;

export default function Sidebar({
  open,
  onClose,
  isAdmin,
  canSwitch,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  canSwitch: boolean;
}) {
  const pathname = usePathname();
  const { key, station, overall, domains, alerts } = useStation();
  const base = `/station/${key}`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-bg-base transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-env" />
              <span className="font-mono text-sm font-semibold tracking-[0.25em] text-text-primary">
                AURORA
              </span>
            </Link>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="cursor-pointer text-text-muted hover:text-text-primary lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-bg-card p-3">
            <p className="text-lg font-semibold text-text-primary">{station.name}</p>
            <p className="mt-0.5 font-mono text-xs text-text-muted">{station.coordinates}</p>
            <div className="mt-2">
              <StatusPill status={overall} />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const href = `${base}${item.path}`;
              const active = pathname === href;
              const Icon = item.icon;
              const domain = "domain" in item ? item.domain : null;

              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-border/60 text-text-primary"
                        : "text-text-muted hover:bg-border/30 hover:text-text-primary"
                    }`}
                  >
                    <Icon size={17} className={active ? "text-accent-env" : ""} />
                    <span className="flex-1">{item.label}</span>

                    {domain && (
                      <span
                        className="h-2 w-2 rounded-full"
                        title={STATUS_META[domains[domain]].label}
                        style={{ backgroundColor: STATUS_META[domains[domain]].color }}
                      />
                    )}
                    {"alertsBadge" in item && alerts.length > 0 && (
                      <span className="rounded-full bg-status-warning/15 px-1.5 font-mono text-xs text-status-warning">
                        {alerts.length}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {(isAdmin || canSwitch) && (
          <div className="flex flex-col gap-1 border-t border-border p-3">
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-accent-env transition-colors hover:bg-accent-env/10"
                >
                  <Shield size={17} />
                  Admin console
                </Link>
                <Link
                  href="/compare"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-border/30 hover:text-text-primary"
                >
                  <ArrowLeftRight size={17} />
                  Compare stations
                </Link>
              </>
            )}
            {canSwitch && (
              <Link
                href="/stations"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-border/30 hover:text-text-primary"
              >
                <ArrowLeft size={17} />
                All stations
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
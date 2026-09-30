"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, MapPin, Shield } from "lucide-react";

import "@/components/landing/landing.css";
import AuroraBackground from "@/components/landing/AuroraBackground";
import { clearSession, login } from "@/lib/authClient";
import { stationHref } from "@/lib/routes";
import { canAccess } from "@/lib/stationAccess";

type Portal = "maitri" | "bharati" | "admin";

const PORTALS: { id: Portal; label: string; sub: string }[] = [
  { id: "maitri", label: "Maitri", sub: "70.77°S 11.73°E" },
  { id: "bharati", label: "Bharati", sub: "69.41°S 76.19°E" },
  { id: "admin", label: "Admin", sub: "All stations" },
];

// Demo accounts (same ones documented in DEMO_CHECKLIST.md).
const DEMO: Record<Portal, { email: string; password: string; label: string }> = {
  maitri: {
    email: "operator@aurora.ncpor.res.in",
    password: "Operator@Aurora2026!",
    label: "Maitri operator",
  },
  bharati: {
    email: "scientist@aurora.ncpor.res.in",
    password: "Bharati@Aurora2026!",
    label: "Bharati operator",
  },
  admin: {
    email: "admin@aurora.ncpor.res.in",
    password: "Admin@Aurora2026!",
    label: "Administrator",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<Portal>("maitri");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectPortal = (p: Portal) => {
    setPortal(p);
    setError(null);
    setEmail("");
    setPassword("");
  };

  const signIn = async (e: string, p: string) => {
    setError(null);
    setLoading(true);
    try {
      const { user } = await login(e, p);

      if (portal === "admin") {
        if (user.role !== "admin") {
          clearSession();
          throw new Error("This account is not an administrator. Choose your station instead.");
        }
        router.push("/stations");
        return;
      }

      const stationName = PORTALS.find((x) => x.id === portal)?.label ?? portal;
      if (!canAccess(user, portal)) {
        clearSession();
        throw new Error(`This account is not assigned to ${stationName}. Choose the correct station.`);
      }
      router.push(stationHref(portal));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setLoading(false);
    }
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    void signIn(email, password);
  };

  const demo = DEMO[portal];
  const portalLabel = PORTALS.find((x) => x.id === portal)?.label;

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-10">
      <AuroraBackground />

      <div className="fade-up relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="rounded-2xl border border-border bg-bg-card/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-env" />
              <span className="font-mono text-sm font-semibold tracking-[0.25em] text-text-primary">
                AURORA
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-text-primary">Sign in</h1>
            <p className="mt-1 text-sm text-text-muted">Choose where you are signing in to.</p>
          </div>

          {/* Portal selector */}
          <div className="mb-5 grid grid-cols-3 gap-2" role="tablist" aria-label="Sign in to">
            {PORTALS.map((p) => {
              const active = portal === p.id;
              const Icon = p.id === "admin" ? Shield : MapPin;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={loading}
                  onClick={() => selectPortal(p.id)}
                  className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors disabled:opacity-50 ${
                    active
                      ? "border-accent-env/60 bg-accent-env/10"
                      : "border-border bg-bg-base/60 hover:bg-border/30"
                  }`}
                >
                  <Icon size={15} className={active ? "text-accent-env" : "text-text-muted"} />
                  <span className="text-sm font-medium text-text-primary">{p.label}</span>
                  <span className="font-mono text-[11px] text-text-muted">{p.sub}</span>
                </button>
              );
            })}
          </div>

          {/* One-click demo access for the selected portal */}
          <div className="mb-5 rounded-xl border border-border bg-bg-base/60 p-3">
            <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
              <span className="rounded bg-accent-energy/15 px-1.5 py-0.5 text-accent-energy">
                Demo mode
              </span>
              {portalLabel} portal
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => void signIn(demo.email, demo.password)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent-energy/30 bg-accent-energy/10 py-2 text-sm text-accent-energy transition-colors hover:bg-accent-energy/20 disabled:opacity-50"
            >
              {portal === "admin" ? <Shield size={14} /> : <MapPin size={14} />}
              Continue as {demo.label}
            </button>
          </div>

          <div className="mb-5 flex items-center gap-3 text-xs text-text-muted">
            <span className="h-px flex-1 bg-border" />
            or use your account
            <span className="h-px flex-1 bg-border" />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-status-critical/30 bg-status-critical/10 p-3 text-xs text-status-critical"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs text-text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@aurora.ncpor.res.in"
                className="w-full rounded-lg border border-border bg-bg-base px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-accent-env focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs text-text-muted">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-base px-3 py-2.5 pr-10 text-sm text-text-primary focus:border-accent-env focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted transition-colors hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent-env py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Signing in…" : `Sign in to ${portalLabel}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
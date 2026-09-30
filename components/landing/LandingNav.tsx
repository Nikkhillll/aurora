import Link from "next/link";
import { ArrowRight } from "lucide-react";

const links = [
  { href: "#problem", label: "Problem" },
  { href: "#how", label: "How it works" },
  { href: "#domains", label: "Domains" },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg-base/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-env" />
          <span className="font-mono text-sm font-semibold tracking-[0.25em] text-text-primary">
            AURORA
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-env px-3.5 py-1.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
        >
          Launch
          <ArrowRight size={14} />
        </Link>
      </div>
    </header>
  );
}
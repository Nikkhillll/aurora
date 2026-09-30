"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { clearSession, getStoredUser, type User } from "@/lib/authClient";
import { allowedStations, canAccess, homeFor } from "@/lib/stationAccess";
import type { StationKey } from "@/lib/stationClient";
import { StationProvider } from "./StationProvider";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function StationShell({
  stationId,
  children,
}: {
  stationId: StationKey;
  children: ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Auth + station-access guard (client-side only, avoids hydration mismatch).
  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    if (!canAccess(stored, stationId)) {
      router.replace(homeFor(stored));
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(stored);
  }, [router, stationId]);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  if (!user) return null;

  const allowed = allowedStations(user);

  return (
    <StationProvider key={stationId} stationKey={stationId}>
      <div className="flex min-h-screen flex-1">
        <Sidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isAdmin={user.role === "admin"}
          canSwitch={allowed.length > 1}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            user={user}
            allowed={allowed}
            onMenu={() => setMenuOpen(true)}
            onLogout={handleLogout}
          />
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </StationProvider>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AdminConsole from "@/components/AdminConsole";
import { getStoredUser, type User } from "@/lib/authClient";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
    } else if (stored.role !== "admin") {
      router.replace("/stations");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(stored);
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link
        href="/stations"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={14} />
        Back to stations
      </Link>
      <AdminConsole currentUser={user} onClose={() => router.push("/stations")} />
    </div>
  );
}
"use client";

import React, { Suspense } from "react";
import Dashboard from "@/components/Dashboard";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const searchParams = useSearchParams();
  const stationParam = searchParams.get("station") || "maitri";

  return <Dashboard initialStation={stationParam} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] text-text-muted flex items-center justify-center font-mono text-xs">Loading Mission Control...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

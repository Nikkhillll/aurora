"use client";

import { useState } from "react";
import { ChevronDown, Download, FileText, Printer } from "lucide-react";

import { exportSnapshotToCSV, exportSnapshotToPrintableReport } from "@/utils/export";
import { useStation } from "./StationProvider";

export default function ReportsMenu() {
  const d = useStation();
  const [open, setOpen] = useState(false);

  // Same payload the old dashboard built for CSV/PDF export.
  const buildSnapshot = () => ({
    station_id: d.key,
    timestamp: new Date().toISOString(),
    environment: {
      temperature_c: d.env.temperature,
      wind_speed_ms: d.env.wind,
      pressure_hpa: d.env.pressure,
      visibility_km: d.snapshot ? d.snapshot.environment.visibility_km : 10,
      status: d.domains.env,
    },
    energy: {
      battery_level_pct: d.energy.batteryLevel,
      generation_kw: d.snapshot
        ? d.snapshot.energy.generation_kw
        : d.energy.solarGeneration + d.energy.windGeneration,
      consumption_kw: d.snapshot ? d.snapshot.energy.consumption_kw : 12,
      projected_hours_remaining: d.snapshot ? d.snapshot.energy.projected_hours_remaining : 24,
      status: d.domains.power,
    },
    infrastructure: {
      equipment_health_pct: d.infra.equipmentHealth,
      building_condition: d.infra.buildingCondition,
      zones: [],
      status: d.domains.struct,
    },
    logistics: {
      fuel_level_pct: d.logistics.fuelLevel,
      supplies_level_pct: d.logistics.foodSupplies,
      spare_parts_count: d.logistics.spareParts,
      next_resupply: d.logistics.resupplyWindow,
      status: d.domains.logistics,
    },
  });

  const run = (kind: "csv" | "pdf") => {
    setOpen(false);
    if (kind === "csv") exportSnapshotToCSV(buildSnapshot(), d.station.name);
    else exportSnapshotToPrintableReport(buildSnapshot(), d.station.name);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg-card px-2.5 py-1.5 text-xs text-text-primary transition-colors hover:bg-border/50"
      >
        <FileText size={14} />
        <span className="hidden sm:inline">Reports</span>
        <ChevronDown size={13} className="text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-border bg-bg-card p-1.5 shadow-2xl"
          >
            <button
              role="menuitem"
              onClick={() => run("csv")}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-border/40"
            >
              <Download size={15} className="text-text-muted" />
              Export CSV snapshot
            </button>
            <button
              role="menuitem"
              onClick={() => run("pdf")}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-border/40"
            >
              <Printer size={15} className="text-text-muted" />
              Printable report (PDF)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
"use client";

import Link from "next/link";
import { ArrowRight, Building2, Gauge, ShieldCheck, SlidersHorizontal, Truck, Zap } from "lucide-react";

import AlertsPanel from "@/components/AlertsPanel";
import HeroSummary from "@/components/station/HeroSummary";
import KpiTile from "@/components/station/KpiTile";
import RiskChain from "@/components/station/RiskChain";
import StationTwin from "@/components/station/StationTwin";
import { useStation } from "@/components/station/StationProvider";
import { BatteryTrendChart, TempTrendChart } from "@/components/station/charts";
import { getSafetyStatus } from "@/components/station/safetyStatus";

// Tile layout: 2 columns on phones, a 3 + 2 arrangement on laptops (6-col grid),
// and all five in one row on very wide screens.
const SPAN_TOP = "lg:col-span-2 2xl:col-span-1";
const SPAN_BOTTOM = "lg:col-span-3 2xl:col-span-1";

function Skeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-40 rounded-2xl bg-border/40" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6 2xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-border/40" />
        ))}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const d = useStation();
  if (!d.ready) return <Skeleton />;

  const base = `/station/${d.key}`;
  const safety = getSafetyStatus(d.env.temperature, d.env.wind, d.personnel.heatingStatus);

  return (
    <div className="flex flex-col gap-5">
      <HeroSummary />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6 2xl:grid-cols-5">
        <KpiTile
          className={SPAN_TOP}
          href={`${base}/environment`}
          icon={Gauge}
          accent="#4CC9F0"
          label="Environment"
          value={d.env.temperature.toFixed(1)}
          unit="°C"
          sub={`Wind ${d.env.wind.toFixed(0)} km/h · ${d.env.pressure.toFixed(0)} hPa`}
          status={d.domains.env}
        />
        <KpiTile
          className={SPAN_TOP}
          href={`${base}/energy`}
          icon={Zap}
          accent="#FFB84D"
          label="Energy"
          value={d.energy.batteryLevel.toFixed(0)}
          unit="% battery"
          sub={
            d.hoursRemaining != null
              ? `${d.hoursRemaining.toFixed(0)} h reserve · ${d.energy.solarGeneration.toFixed(1)} kW gen`
              : `${d.energy.solarGeneration.toFixed(1)} kW generation`
          }
          status={d.domains.power}
        />
        <KpiTile
          className={SPAN_TOP}
          href={`${base}/infrastructure`}
          icon={Building2}
          accent="#34D399"
          label="Infrastructure"
          value={d.infra.equipmentHealth.toFixed(0)}
          unit="% health"
          sub={`${d.infra.buildingCondition} · sensors ${d.infra.sensorStatus}%`}
          status={d.domains.struct}
        />
        <KpiTile
          className={SPAN_BOTTOM}
          href={`${base}/logistics`}
          icon={Truck}
          accent="#8592A3"
          label="Logistics"
          value={d.logistics.fuelLevel.toFixed(0)}
          unit="% fuel"
          sub={`Resupply ${d.logistics.resupplyWindow}`}
          status={d.domains.logistics}
        />
        <KpiTile
          className={`col-span-2 ${SPAN_BOTTOM}`}
          href={`${base}/safety`}
          icon={ShieldCheck}
          accent="#F5A524"
          label="Safety"
          value={String(d.personnel.onSite)}
          unit="on site"
          sub={`of ${d.personnel.totalPersonnel} · cold exposure ${safety.coldRisk.toLowerCase()} · heating ${d.personnel.heatingStatus}`}
          status={safety.status}
        />
      </div>

      {/* Twin + cascade on the left, alerts on the right */}
      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <StationTwin />
          <RiskChain />
        </div>
        <div className="lg:col-span-2">
          <AlertsPanel alerts={d.alerts} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TempTrendChart station={d.key} />
        <BatteryTrendChart station={d.key} />
      </div>

      <Link
        href={`${base}/simulate`}
        className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-accent-env/40"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7C5CFF]/15">
            <SlidersHorizontal size={20} className="text-[#7C5CFF]" />
          </div>
          <div>
            <h2 className="text-base font-medium text-text-primary">Run a what-if scenario</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-muted">
              Simulate a storm, equipment failure or resupply delay at {d.station.name} and see how
              battery endurance changes before it happens.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-env">
          Open simulator
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </div>
  );
}
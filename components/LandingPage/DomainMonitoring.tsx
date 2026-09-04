"use client";

import React, { useState } from "react";
import {
  Thermometer,
  Zap,
  Home,
  Truck,
  Activity,
} from "lucide-react";

export default function DomainMonitoring() {
  const [selectedDomain, setSelectedDomain] = useState<"env" | "energy" | "infra" | "logistics">("env");

  const domains = [
    {
      id: "env" as const,
      name: "Environment",
      tagline: "Microclimate & Blizzard Dynamics",
      accent: "#4CC9F0",
      icon: Thermometer,
      metrics: [
        { label: "Ambient Temperature", value: "-34.5°C", sub: "Trend: -1.2°C/hr", status: "Nominal" },
        { label: "Katabatic Wind Speed", value: "42 kt (78 km/h)", sub: "Max Gust: 64 kt", status: "Warning" },
        { label: "Barometric Pressure", value: "968 hPa", sub: "Falling (-4.5 hPa/3h)", status: "Storm Warning" },
        { label: "Visibility", value: "1.2 km", sub: "Blowing Snow", status: "Degraded" },
      ],
      benefits: [
        "Real-time katabatic wind acceleration tracking with early storm warning triggers.",
        "Automatic chill-factor calculations preventing frostbite hazard during outside sorties.",
        "Solar irradiance prediction to forecast upcoming PV generation windows.",
      ],
      sensors: ["Vaisala WXT530 AWS", "Campbell Scientific Sonic Anemometers", "Kipp & Zonen Pyranometers"],
    },
    {
      id: "energy" as const,
      name: "Energy & Microgrid",
      tagline: "Hybrid Generation & Storage Autonomy",
      accent: "#FFB84D",
      icon: Zap,
      metrics: [
        { label: "Solar PV Generation", value: "14.2 kW", sub: "Peak: 22.0 kW", status: "Active" },
        { label: "Battery SOC (Reserve)", value: "61%", sub: "18.4 hrs remaining", status: "Nominal" },
        { label: "Diesel Gen 1 Load", value: "48 kW (65%)", sub: "Fuel rate: 12.4 L/h", status: "Nominal" },
        { label: "Station Demand", value: "62.2 kW", sub: "Base Life Support: 38 kW", status: "Nominal" },
      ],
      benefits: [
        "Real-time hybrid balancing between solar arrays, wind turbines, and diesel generators.",
        "Predictive battery State-of-Charge (SOC) decay curves under varying blizzard intensities.",
        "Automated non-critical load shedding protocols to preserve life-support heating circuits.",
      ],
      sensors: ["Schneider Electric Microgrid PM8000", "Victron Energy BMS", "Flowtech Diesel Mass Meters"],
    },
    {
      id: "infra" as const,
      name: "Infrastructure & Life Support",
      tagline: "Thermal Envelope & Structural Integrity",
      accent: "#818CF8",
      icon: Home,
      metrics: [
        { label: "Living Module Temp", value: "+21.4°C", sub: "Set Point: +21.0°C", status: "Optimal" },
        { label: "Zone 3 Pressure", value: "+15 Pa", sub: "Positive seal against snow ingress", status: "Nominal" },
        { label: "Water RO Plant", value: "3,200 L", sub: "Daily usage: 1,800 L", status: "Nominal" },
        { label: "Structural Load Cells", value: "12.4 kN/m²", sub: "Snow drift accumulation", status: "Nominal" },
      ],
      benefits: [
        "Airlock pressurization tracking preventing sub-zero blizzards from freezing indoor corridors.",
        "Structural load cell monitoring to detect dangerous snowdrift buildup on containerized pods.",
        "Reverse osmosis water recycling plant telemetry ensuring uninterrupted crew water supply.",
      ],
      sensors: ["Honeywell Differential Pressure Transmitters", "Strain Gauge Load Cells", "Endress+Hauser Flowmeters"],
    },
    {
      id: "logistics" as const,
      name: "Logistics & Supply Chain",
      tagline: "Fuel Autonomy & Resupply Countdown",
      accent: "#34D399",
      icon: Truck,
      metrics: [
        { label: "Aviation Turbine Fuel (ATF)", value: "84 Days", sub: "142,000 Liters in bunds", status: "Nominal" },
        { label: "Food Rations (Freeze-dried)", value: "210 Days", sub: "Emergency cache: +60d", status: "Optimal" },
        { label: "Critical Spare Parts", value: "98.4%", sub: "2 items on reorder", status: "Nominal" },
        { label: "Next Resupply Window", value: "78 Days", sub: "R/V Bharati Voyage 46", status: "On Schedule" },
      ],
      benefits: [
        "Burn-rate predictive forecasting based on external weather temperature curves.",
        "Automated spare-part reorder lead times synced with annual Antarctic expedition schedules.",
        "Medical and emergency survival cache telemetry verifying readiness for winterover isolation.",
      ],
      sensors: ["Enraf Radar Tank Gauging", "RFID Inventory Barcode Gateways", "NCPOR Expedition ERP Sync"],
    },
  ];

  const curr = domains.find((d) => d.id === selectedDomain) ?? domains[0];
  const Icon = curr.icon;

  return (
    <section id="domains" className="py-20 border-b border-border bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#FFB84D] border border-[#FFB84D]/30 bg-[#FFB84D]/10 px-3 py-1 rounded-full inline-block mb-3">
            Holistic Telemetry Ingestion
          </span>
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
            Four-Domain Comprehensive Monitoring
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
            Every critical Antarctic life-support system integrated into a unified Digital Twin schema.
          </p>
        </div>

        {/* Domain Selection Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {domains.map((dom) => {
            const DomIcon = dom.icon;
            const isSelected = dom.id === selectedDomain;
            return (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "border-[#4CC9F0] bg-[#131A24] shadow-[0_0_20px_rgba(76,201,240,0.12)]"
                    : "border-border bg-bg-base hover:bg-[#131A24]/60"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DomIcon size={18} style={{ color: isSelected ? dom.accent : "#8592A3" }} />
                  <span className="font-sans font-bold text-sm text-text-primary">{dom.name}</span>
                </div>
                <p className="text-xs font-mono text-text-muted truncate">{dom.tagline}</p>
                {isSelected && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: dom.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Domain Deep-Dive Container */}
        <div className="rounded-xl border border-border bg-[#131A24] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl border flex items-center justify-center"
                style={{
                  backgroundColor: `${curr.accent}15`,
                  borderColor: `${curr.accent}40`,
                  color: curr.accent,
                }}
              >
                <Icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-sans font-bold text-text-primary">{curr.name}</h3>
                <p className="text-xs font-mono text-text-muted">{curr.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-bg-base border border-border text-text-primary">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: curr.accent }} />
                Live InfluxDB Feed Active
              </span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {curr.metrics.map((m) => (
              <div key={m.label} className="p-4 rounded-lg border border-border bg-bg-base">
                <span className="text-xs font-mono text-text-muted block mb-1">{m.label}</span>
                <div className="text-xl font-mono font-bold text-text-primary mb-1">{m.value}</div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-text-muted">{m.sub}</span>
                  <span className="text-[#34D399] font-medium">{m.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Operational Benefits & Connected Sensors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            <div className="md:col-span-8 space-y-2.5">
              <span className="text-xs font-mono uppercase text-text-muted block font-semibold">
                Operational Advantages:
              </span>
              {curr.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-text-muted">
                  <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: curr.accent }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="md:col-span-4 p-4 rounded-lg bg-bg-base border border-border">
              <span className="text-xs font-mono uppercase text-text-muted block mb-2 font-semibold">
                Hardware & Sensor Feed:
              </span>
              <ul className="space-y-1.5 text-xs font-mono text-text-primary">
                {curr.sensors.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <Activity size={12} className="text-[#4CC9F0] shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

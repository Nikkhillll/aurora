"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  Thermometer,
  Zap,
  Truck,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function StationComparison() {
  const stations = [
    {
      id: "maitri",
      name: "Maitri Station",
      tagline: "India's Inland Antarctic Outpost",
      location: "Schirmacher Oasis, Queen Maud Land",
      coords: "70.77° S, 11.73° E",
      established: "1989 (36+ Years of Continuous Ops)",
      crewCapacity: "25 Overwintering Scientists & Engineers",
      powerSystem: "Hybrid Solar PV + 3x 62.5 kVA Diesel Generator Bank",
      elevation: "117 m above sea level",
      status: "Nominal Operations",
      statusColor: "#34D399",
      metrics: {
        temp: "-34.5°C",
        wind: "42 kt (78 km/h)",
        battery: "61%",
        batteryHours: "18.4 hrs",
        fuelAutonomy: "84 Days",
        activeAlerts: "1 Low",
        structuralHealth: "94% (Nominal)",
      },
    },
    {
      id: "bharati",
      name: "Bharati Station",
      tagline: "State-of-the-Art Coastal Digital Hub",
      location: "Larsemann Hills, East Antarctica",
      coords: "69.40° S, 76.19° E",
      established: "2012 (Energy-Efficient Containerized Monoblock)",
      crewCapacity: "23 Overwintering Specialists",
      powerSystem: "Cogeneration Combined Heat & Power (CHP) + Wind Turbines",
      elevation: "35 m above sea level",
      status: "Blizzard Warning Active",
      statusColor: "#F5A524",
      metrics: {
        temp: "-28.2°C",
        wind: "54 kt (100 km/h)",
        battery: "48%",
        batteryHours: "12.8 hrs",
        fuelAutonomy: "112 Days",
        activeAlerts: "3 Active",
        structuralHealth: "89% (Monitoring)",
      },
    },
  ];

  return (
    <section id="stations" className="py-20 border-b border-border bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 rounded-full inline-block mb-3">
            Multi-Station Polar Digital Twin
          </span>
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
            Maitri vs. Bharati Station Matrix
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
            Continuous remote operational visibility across India&apos;s active Antarctic research stations,
            separated by over 3,000 kilometers of frozen continent.
          </p>
        </div>

        {/* Side-by-Side Station Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {stations.map((st) => (
            <div
              key={st.id}
              className="rounded-xl border border-border bg-[#131A24] p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              <div>
                {/* Station Badge & Status */}
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg border border-[#4CC9F0]/30 bg-[#4CC9F0]/10 text-[#4CC9F0]">
                      <Compass size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-sans font-bold text-text-primary">{st.name}</h3>
                      <span className="text-xs font-mono text-text-muted">{st.coords}</span>
                    </div>
                  </div>

                  <span
                    className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase"
                    style={{
                      backgroundColor: `${st.statusColor}15`,
                      color: st.statusColor,
                      border: `1px solid ${st.statusColor}40`,
                    }}
                  >
                    {st.status}
                  </span>
                </div>

                {/* Geographical & Mission Metadata */}
                <div className="space-y-2 mb-6 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-text-muted">Geographical Sector:</span>
                    <span className="text-text-primary font-medium">{st.location}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-text-muted">Commissioned:</span>
                    <span className="text-text-primary font-medium">{st.established}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-text-muted">Winter Crew Complement:</span>
                    <span className="text-text-primary font-medium">{st.crewCapacity}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-muted">Generation Architecture:</span>
                    <span className="text-text-primary font-medium text-right max-w-[240px] truncate">{st.powerSystem}</span>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-bg-base border border-border">
                    <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                      <Thermometer size={12} className="text-[#4CC9F0]" />
                      <span>Ambient Temp</span>
                    </div>
                    <div className="font-mono text-base font-bold text-[#4CC9F0]">{st.metrics.temp}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-bg-base border border-border">
                    <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                      <Activity size={12} className="text-[#38BDF8]" />
                      <span>Wind Velocity</span>
                    </div>
                    <div className="font-mono text-base font-bold text-text-primary">{st.metrics.wind}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-bg-base border border-border">
                    <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                      <Zap size={12} className="text-[#FFB84D]" />
                      <span>Battery Reserve</span>
                    </div>
                    <div className="font-mono text-base font-bold text-[#FFB84D]">{st.metrics.battery} ({st.metrics.batteryHours})</div>
                  </div>

                  <div className="p-3 rounded-lg bg-bg-base border border-border">
                    <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                      <Truck size={12} className="text-[#34D399]" />
                      <span>Fuel Autonomy</span>
                    </div>
                    <div className="font-mono text-base font-bold text-[#34D399]">{st.metrics.fuelAutonomy}</div>
                  </div>
                </div>
              </div>

              {/* Station Deep-Dive CTA */}
              <Link
                href={`/dashboard?station=${st.id}`}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-base py-2.5 text-xs font-mono font-bold text-text-primary hover:border-[#4CC9F0] hover:text-[#4CC9F0] transition-colors"
              >
                <span>Launch {st.name} Telemetry Console</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

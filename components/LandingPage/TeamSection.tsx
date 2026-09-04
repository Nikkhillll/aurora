"use client";

import React from "react";
import { Shield, Cpu, Activity, Database, Layers, CheckCircle2 } from "lucide-react";

export default function TeamSection() {
  const teamMembers = [
    {
      roleNum: "Person 1",
      title: "Core Architecture & System Assembly",
      focus: "FastAPI Core Engine, Route Ingestion & Digital Twin Coordination",
      icon: Cpu,
      color: "#4CC9F0",
    },
    {
      roleNum: "Person 2",
      title: "Real-time Telemetry & Data Pipeline",
      focus: "InfluxDB Time-Series Feed, MQTT Broker & IoT Sensor Gateway",
      icon: Database,
      color: "#38BDF8",
    },
    {
      roleNum: "Person 3",
      title: "Environmental & Energy Simulation",
      focus: "Microclimate Dynamics, Solar PV Models & Battery Decay Curves",
      icon: Activity,
      color: "#FFB84D",
    },
    {
      roleNum: "Person 4",
      title: "Machine Learning & Risk Forecasting",
      focus: "Time-Series Hazard Prediction, Blizzard Onset & Anomaly Detection",
      icon: Layers,
      color: "#818CF8",
    },
    {
      roleNum: "Person 5",
      title: "Infrastructure & Logistics Engine",
      focus: "Airlock Thermal Integrity, Fuel Reserves & Resupply Optimization",
      icon: Shield,
      color: "#F5A524",
    },
    {
      roleNum: "Person 6",
      title: "Security, RBAC, Notifications & QA",
      focus: "JWT Auth, Admin Console, WebSockets, PDF/CSV Export & Testing",
      icon: CheckCircle2,
      color: "#34D399",
    },
  ];

  return (
    <section id="team" className="py-20 border-b border-border bg-[#0B0F14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#818CF8] border border-[#818CF8]/30 bg-[#818CF8]/10 px-3 py-1 rounded-full inline-block mb-3">
            Smart India Hackathon 2026
          </span>
          <h2 className="text-2xl sm:text-4xl font-sans font-bold text-text-primary tracking-tight">
            Team ASTRA MeridianX
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted font-sans">
            Built for Problem Statement <strong className="text-text-primary font-medium">SIH26060</strong> — National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences (MoES), Government of India.
          </p>
        </div>

        {/* 6 Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => {
            const Icon = member.icon;
            return (
              <div
                key={member.roleNum}
                className="rounded-xl border border-border bg-[#131A24] p-6 hover:border-[#4CC9F0]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: `${member.color}15`,
                        borderColor: `${member.color}30`,
                        color: member.color,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase"
                      style={{
                        backgroundColor: `${member.color}10`,
                        color: member.color,
                        border: `1px solid ${member.color}30`,
                      }}
                    >
                      {member.roleNum}
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-base text-text-primary mb-1.5">
                    {member.title}
                  </h3>

                  <p className="text-xs font-mono text-text-muted leading-relaxed">
                    {member.focus}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-text-muted">
                  <span>ASTRA MeridianX</span>
                  <span className="text-[#34D399]">Active Module ✓</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

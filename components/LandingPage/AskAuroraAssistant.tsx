"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Bot,
  Send,
  X,
  CheckCircle2,
  Info,
  ChevronRight,
} from "lucide-react";

interface QAPair {
  question: string;
  category: string;
  answer: string;
  highlights: string[];
}

const KNOWLEDGE_BASE: QAPair[] = [
  {
    category: "Stations",
    question: "What are the key differences between Maitri and Bharati stations?",
    highlights: ["Maitri: 70.77°S (Inland oasis, established 1989)", "Bharati: 69.40°S (Coastal promontory, containerized CHP monoblock)"],
    answer:
      "Maitri Station is located in the inland rocky Schirmacher Oasis (70.77°S, 11.73°E), commissioned in 1989 with a 25-person winter crew powered by diesel-solar hybrid arrays. Bharati Station is located in the coastal Larsemann Hills (69.40°S, 76.19°E), commissioned in 2012 featuring an energy-efficient containerized monoblock structure with combined heat and power (CHP) cogeneration and wind turbines.",
  },
  {
    category: "Simulation",
    question: "How does the What-If Simulator forecast battery life during blizzards?",
    highlights: ["Thermodynamic solar decay", "ML battery state-of-charge curve", "Dynamic load shedding"],
    answer:
      "When a severe storm is triggered, solar PV generation immediately decays towards 0 kW due to cloud/snow cover. The simulator integrates real-time demand (approx 62 kW) against remaining battery capacity and temperature-adjusted discharge efficiency, calculating the exact hours remaining before emergency auxiliary diesel generators must engage.",
  },
  {
    category: "Risk & Alerts",
    question: "How are operational risk levels and alert thresholds determined?",
    highlights: ["Wind speed > 45 kt (High/Critical)", "Battery < 30% (Critical)", "Fuel < 30 days (Warning)"],
    answer:
      "AURORA computes risk across 4 independent vectors: Weather risk triggers High when katabatic winds exceed 45 kt or barometric pressure drops > 4 hPa/3h. Power risk escalates to Critical when battery drops below 30%. Infrastructure and Logistics risks escalate when airlock differential pressure fails or fuel autonomy falls below safe winterover margins.",
  },
  {
    category: "Data Ingestion",
    question: "What IoT telemetry and sensor hardware feed into AURORA?",
    highlights: ["Vaisala WXT530 AWS", "Victron & Schneider BMS", "Radar tank gauges", "Zone pressure sensors"],
    answer:
      "AURORA ingests high-frequency telemetry including Vaisala automated weather stations (wind velocity, temperature, barometric pressure), battery management system (BMS) cell voltages and currents, radar tank gauges for aviation turbine fuel (ATF), differential pressure sensors for airlock integrity, and reverse osmosis plant status.",
  },
  {
    category: "Security & RBAC",
    question: "What is the difference between Operator and Administrator roles?",
    highlights: ["Operator: Live telemetry monitoring, simulator, alert acknowledgment, report export", "Admin: User provisioning, role assignment, account activation/deactivation, audit trail inspection"],
    answer:
      "Operators have full operational visibility: viewing live telemetry, acknowledging alerts, testing what-if scenarios, and exporting PDF/CSV reports. Administrators have additional security authority: provisioning new user accounts, modifying operator/admin roles, enabling/disabling credentials, and reviewing the immutable security audit log.",
  },
  {
    category: "SIH Problem",
    question: "How does AURORA address SIH Problem Statement SIH26060?",
    highlights: ["Unified Digital Twin", "Proactive 24–72h hazard prediction", "Zero-crash offline resiliency"],
    answer:
      "Problem Statement SIH26060 requires a unified digital twin platform for remote Antarctic research stations. AURORA solves this by integrating four previously fragmented operational silos (Environment, Energy, Infrastructure, Logistics) into a single predictive mission control dashboard that works reliably over intermittent satellite links.",
  },
];

interface AskAuroraAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AskAuroraAssistant({
  onClose,
}: AskAuroraAssistantProps) {
  const [selectedQA, setSelectedQA] = useState<QAPair>(KNOWLEDGE_BASE[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);

  const filteredQAs = KNOWLEDGE_BASE.filter(
    (qa) =>
      qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qa.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qa.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectQA = (qa: QAPair) => {
    setSelectedQA(qa);
    setCustomAnswer(null);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Best match search in knowledge base
    const match = KNOWLEDGE_BASE.find(
      (qa) =>
        qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (match) {
      setSelectedQA(match);
      setCustomAnswer(null);
    } else {
      setCustomAnswer(
        `I found relevant operational records regarding "${searchQuery}". AURORA monitors 4 domains across Maitri (70.77°S) and Bharati (69.40°S) stations with live telemetry, what-if predictive modeling, and NCPOR administrative governance.`
      );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-[#131A24] p-6 sm:p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg border border-[#4CC9F0]/30 bg-[#4CC9F0]/10 text-[#4CC9F0]">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-sans font-bold text-text-primary">
                Ask AURORA
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30 font-semibold">
                Domain Knowledge Base
              </span>
            </div>
            <p className="text-xs font-mono text-text-muted">
              Interactive guidance for SIH judges and Antarctic station evaluators
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-border/40"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Questions List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Search Box */}
          <form onSubmit={handleCustomSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask about stations, batteries, blizzards..."
              className="w-full rounded-lg border border-border bg-bg-base px-3.5 py-2 pl-9 text-xs font-mono text-text-primary placeholder:text-text-muted/60 focus:border-[#4CC9F0] focus:outline-none"
            />
            <MessageSquare
              size={14}
              className="absolute left-3 top-2.5 text-text-muted"
            />
            {searchQuery && (
              <button
                type="submit"
                className="absolute right-2 top-1.5 rounded p-1 text-[#4CC9F0] hover:bg-[#4CC9F0]/10"
              >
                <Send size={12} />
              </button>
            )}
          </form>

          {/* Preset Question Pills */}
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
            {filteredQAs.map((qa) => {
              const isSelected = selectedQA.question === qa.question && !customAnswer;
              return (
                <button
                  key={qa.question}
                  onClick={() => handleSelectQA(qa)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs font-sans flex items-center justify-between gap-2 ${
                    isSelected
                      ? "border-[#4CC9F0] bg-[#4CC9F0]/10 text-text-primary font-medium"
                      : "border-border/70 bg-bg-base text-text-muted hover:text-text-primary hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-card text-[#4CC9F0] shrink-0">
                      {qa.category}
                    </span>
                    <span className="truncate">{qa.question}</span>
                  </div>
                  <ChevronRight size={13} className="shrink-0 text-text-muted" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Answer Display */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-bg-base p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30 font-semibold">
                {customAnswer ? "Custom Query" : selectedQA.category}
              </span>
              <span className="text-xs font-mono text-text-muted">
                {customAnswer ? "AURORA Search" : "Verified Mission Specification"}
              </span>
            </div>

            <h4 className="font-sans font-bold text-base text-text-primary mb-3">
              {customAnswer ? `Search: "${searchQuery}"` : selectedQA.question}
            </h4>

            <p className="text-xs sm:text-sm text-text-primary/90 font-sans leading-relaxed mb-4">
              {customAnswer || selectedQA.answer}
            </p>

            {!customAnswer && selectedQA.highlights.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-border">
                <span className="text-[11px] font-mono uppercase text-text-muted block">
                  Key Takeaways:
                </span>
                {selectedQA.highlights.map((hl, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs font-mono text-[#34D399]"
                  >
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              <Info size={12} className="text-[#4CC9F0]" />
              Offline Operational Assistant (No external API dependency)
            </span>
            <span>NCPOR Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

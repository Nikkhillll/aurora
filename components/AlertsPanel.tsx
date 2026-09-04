"use client";

import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
} from "lucide-react";
import type { Alert } from "@/data/mockData";

const severityConfig = {
  critical: {
    color: "#F5484F",
    icon: ShieldAlert,
    label: "Critical",
  },
  high: {
    color: "#F5484F",
    icon: AlertTriangle,
    label: "High",
  },
  medium: {
    color: "#F5A524",
    icon: AlertCircle,
    label: "Medium",
  },
  low: {
    color: "#34D399",
    icon: Info,
    label: "Low",
  },
} as const;

interface AlertsPanelProps {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="rounded-[12px] border border-border bg-bg-card p-5 flex flex-col gap-4">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-text-muted" />
          <h2 className="text-base text-text-muted font-sans">Alerts</h2>
        </div>

        <span className="text-xs font-mono text-text-muted">
          {alerts.length} active
        </span>
      </div>

      {/* Alert list */}
      <div className="flex flex-col gap-2">
        {alerts.length === 0 ? (
          <p className="text-xs text-text-muted font-sans">
            No active alerts
          </p>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-[8px] p-3"
                style={{
                  backgroundColor: `${config.color}0F`,
                  border: `1px solid ${config.color}30`,
                }}
              >
                <Icon
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: config.color }}
                />

                <div className="flex flex-col gap-1 min-w-0">
                  <span
                    className="text-[11px] font-mono font-medium uppercase tracking-wide w-fit"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>

                  <p className="text-sm text-text-primary font-sans leading-snug">
                    {alert.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
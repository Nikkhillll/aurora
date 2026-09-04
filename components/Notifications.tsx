"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Radio,
} from "lucide-react";
import { wsClient, type AlertPayload, type ConnectionStatus } from "@/lib/wsClient";

export interface AppNotification {
  id: string;
  station_id: string;
  severity: "critical" | "warning" | "high" | "medium" | "low" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const severityStyles = {
  critical: {
    color: "#F5484F",
    icon: AlertTriangle,
    label: "CRITICAL",
    bg: "rgba(245, 72, 79, 0.12)",
    border: "rgba(245, 72, 79, 0.35)",
  },
  high: {
    color: "#F5484F",
    icon: AlertTriangle,
    label: "HIGH",
    bg: "rgba(245, 72, 79, 0.12)",
    border: "rgba(245, 72, 79, 0.35)",
  },
  warning: {
    color: "#F5A524",
    icon: AlertCircle,
    label: "WARNING",
    bg: "rgba(245, 165, 36, 0.12)",
    border: "rgba(245, 165, 36, 0.35)",
  },
  medium: {
    color: "#F5A524",
    icon: AlertCircle,
    label: "MEDIUM",
    bg: "rgba(245, 165, 36, 0.12)",
    border: "rgba(245, 165, 36, 0.35)",
  },
  low: {
    color: "#34D399",
    icon: Info,
    label: "LOW",
    bg: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.35)",
  },
  info: {
    color: "#4CC9F0",
    icon: Info,
    label: "INFO",
    bg: "rgba(76, 201, 240, 0.12)",
    border: "rgba(76, 201, 240, 0.35)",
  },
} as const;

interface NotificationsProps {
  stationId?: string;
  className?: string;
}

export default function Notifications({ stationId, className = "" }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>("disconnected");
  const panelRef = useRef<HTMLDivElement>(null);

  // Connect WebSocket & listen for live alerts
  useEffect(() => {
    wsClient.connect(stationId || null);

    const unsubStatus = wsClient.onStatus((status) => {
      setWsStatus(status);
    });

    const unsubAlert = wsClient.onAlert((alertPayload: AlertPayload) => {
      const newNotif: AppNotification = {
        id: alertPayload.id || `notif_${Date.now()}`,
        station_id: alertPayload.station_id || stationId || "maitri",
        severity: alertPayload.severity || "warning",
        title: alertPayload.title || "Operational Risk Alert",
        message: alertPayload.message,
        timestamp: alertPayload.created_at || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => {
        // Deduplicate by ID
        if (prev.some((n) => n.id === newNotif.id)) {
          return prev;
        }
        return [newNotif, ...prev];
      });

      // Show toast for critical/warning alerts
      if (
        newNotif.severity === "critical" ||
        newNotif.severity === "high" ||
        newNotif.severity === "warning"
      ) {
        setActiveToast(newNotif);
      }
    });

    return () => {
      unsubStatus();
      unsubAlert();
    };
  }, [stationId]);

  // Update station filter when station changes
  useEffect(() => {
    if (stationId) {
      wsClient.setStation(stationId);
    }
  }, [stationId]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Close panel on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Notification Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative p-2 rounded-lg border border-border bg-bg-card hover:bg-border/50 text-text-primary transition-colors flex items-center gap-2"
        title="Live Operational Notifications"
      >
        <Bell size={16} className={unreadCount > 0 ? "text-[#4CC9F0]" : "text-text-muted"} />
        {unreadCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F5484F] px-1 text-[10px] font-mono font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Pop-up Toast Banner */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-[#F5484F]/40 bg-bg-card p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-[#F5484F] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#F5484F]">
                  {activeToast.station_id.toUpperCase()} · {activeToast.severity}
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  {activeToast.timestamp.slice(11, 16)} UTC
                </span>
              </div>
              <h4 className="text-xs font-semibold text-text-primary mt-0.5">
                {activeToast.title}
              </h4>
              <p className="text-xs text-text-muted mt-1 leading-snug">
                {activeToast.message}
              </p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-text-muted hover:text-text-primary p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Notification Slide-out Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-bg-card shadow-2xl z-50 overflow-hidden flex flex-col text-text-primary">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-bg-base/40">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-[#4CC9F0]" />
              <span className="text-xs font-sans font-medium text-text-primary">
                Operational Notifications
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                <Radio
                  size={10}
                  className={wsStatus === "connected" ? "text-[#34D399]" : "text-[#F5A524]"}
                />
                {wsStatus}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="p-1 rounded text-text-muted hover:text-[#34D399] transition-colors"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  title="Clear notifications"
                  className="p-1 rounded text-text-muted hover:text-[#F5484F] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted flex flex-col items-center gap-2">
                <Bell size={24} className="opacity-30" />
                <span>No active operational notifications.</span>
                <span className="text-[10px] font-mono">
                  Live risk alerts from telemetry will appear here in real-time.
                </span>
              </div>
            ) : (
              notifications.map((notif) => {
                const style = severityStyles[notif.severity] || severityStyles.info;
                const Icon = style.icon;

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors flex items-start gap-3 ${
                      notif.read ? "opacity-60 bg-transparent" : "bg-border/10"
                    }`}
                  >
                    <Icon
                      size={16}
                      className="mt-0.5 shrink-0"
                      style={{ color: style.color }}
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[10px] font-mono font-bold uppercase tracking-wide"
                          style={{ color: style.color }}
                        >
                          {notif.station_id.toUpperCase()} · {style.label}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">
                          {notif.timestamp.slice(11, 16)} UTC
                        </span>
                      </div>
                      <p className="text-xs font-medium text-text-primary leading-tight">
                        {notif.title}
                      </p>
                      <p className="text-xs text-text-muted leading-snug">
                        {notif.message}
                      </p>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        title="Mark as read"
                        className="p-1 rounded text-text-muted hover:text-text-primary shrink-0"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 py-2 bg-bg-base/60 flex items-center justify-between text-[10px] font-mono text-text-muted">
            <span>AURORA Risk Engine</span>
            <span>WebSocket Live Stream</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Real-time WebSocket Client for AURORA.
 * Connects to /ws/live with station filtering and JWT token authentication.
 * Manages heartbeat ping/pong, automatic reconnection, and typed event dispatching.
 */

import { getToken } from "./authClient";

export interface AlertPayload {
  id: string;
  station_id: string;
  severity: "critical" | "warning" | "high" | "medium" | "low";
  title?: string;
  message: string;
  source?: string;
  created_at?: string;
  acknowledged?: boolean;
}

export interface TelemetrySnapshotPayload {
  station_id: string;
  timestamp: string;
  environment: {
    temperature_c: number;
    wind_speed_ms: number;
    pressure_hpa: number;
    visibility_km: number;
    status: string;
  };
  energy: {
    battery_level_pct: number;
    generation_kw: number;
    consumption_kw: number;
    projected_hours_remaining: number;
    status: string;
  };
  infrastructure: {
    equipment_health_pct: number;
    building_condition: string;
    zones: Array<{ id: string; name: string; status: string }>;
    status: string;
  };
  logistics: {
    fuel_level_pct: number;
    supplies_level_pct: number;
    spare_parts_count: number;
    next_resupply: string;
    status: string;
  };
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

type AlertListener = (alert: AlertPayload) => void;
type TelemetryListener = (telemetry: TelemetrySnapshotPayload) => void;
type StatusListener = (status: ConnectionStatus) => void;

class AuroraWebSocketClient {
  private socket: WebSocket | null = null;
  private stationId: string | null = null;
  private status: ConnectionStatus = "disconnected";
  private alertListeners = new Set<AlertListener>();
  private telemetryListeners = new Set<TelemetryListener>();
  private statusListeners = new Set<StatusListener>();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = true;

  constructor() {
    // Client initialized lazily
  }

  public connect(stationId: string | null = null): void {
    this.stationId = stationId;
    this.shouldReconnect = true;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus("connecting");
    const wsUrl = this.buildWebSocketUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch {
          // Ignore invalid JSON
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.setStatus(this.shouldReconnect ? "reconnecting" : "disconnected");
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.setStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  public setStation(stationId: string | null): void {
    if (this.stationId !== stationId) {
      this.stationId = stationId;
      // Reconnect with new station filter query
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.disconnect();
        this.connect(stationId);
      }
    }
  }

  public onAlert(listener: AlertListener): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  public onTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => this.telemetryListeners.delete(listener);
  }

  public onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private buildWebSocketUrl(): string {
    const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsBase = rawApi.replace(/^http/, "ws");
    const params = new URLSearchParams();

    if (this.stationId) {
      params.set("station_id", this.stationId);
    }
    const token = getToken();
    if (token) {
      params.set("token", token);
    }

    const query = params.toString();
    return `${wsBase}/ws/live${query ? `?${query}` : ""}`;
  }

  private setStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  private handleIncomingMessage(msg: { type: string; payload?: unknown }): void {
    if (msg.type === "alert" && msg.payload) {
      const alert = msg.payload as AlertPayload;
      this.alertListeners.forEach((fn) => fn(alert));
    } else if (msg.type === "telemetry" && msg.payload) {
      const telemetry = msg.payload as TelemetrySnapshotPayload;
      this.telemetryListeners.forEach((fn) => fn(telemetry));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: "ping" }));
        } catch {
          // Ignore
        }
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimeout) return;

    this.reconnectAttempts += 1;
    // Exponential backoff: 1s, 2s, 4s, max 10s
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.shouldReconnect) {
        this.connect(this.stationId);
      }
    }, delay);
  }
}

export const wsClient = new AuroraWebSocketClient();

/**
 * Real-time WebSocket Client for AURORA.
 * Connects to /ws/live with station filtering and JWT token authentication.
 * Manages heartbeat ping/pong, automatic reconnection, and typed event dispatching.
 *
 * HYBRID & RESILIENT:
 * Handles HTTPS/WSS conversions, avoids aggressive reconnect loops on static deployments,
 * and maintains demo stability when backend is unreachable.
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
  private maxReconnectAttempts = 3;
  private shouldReconnect = true;

  public connect(stationId: string | null = null): void {
    if (typeof window === "undefined") return;

    this.stationId = stationId;
    this.shouldReconnect = true;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = this.buildWebSocketUrl();
    if (!wsUrl) {
      this.setStatus("disconnected");
      return;
    }

    this.setStatus("connecting");

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
          // Ignore non-JSON
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.setStatus("reconnecting");
          this.scheduleReconnect();
        } else {
          this.setStatus("disconnected");
        }
      };

      this.socket.onerror = () => {
        // Quietly close socket on error
        try {
          this.socket?.close();
        } catch {}
      };
    } catch {
      this.setStatus("disconnected");
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
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
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  public setStation(stationId: string | null): void {
    if (this.stationId !== stationId) {
      this.stationId = stationId;
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

  private buildWebSocketUrl(): string | null {
    if (typeof window === "undefined") return null;

    // If on HTTPS and no custom API URL is set, avoid insecure ws:// connection
    const isHttps = window.location.protocol === "https:";
    const defaultBase = isHttps ? "" : "http://localhost:8000";
    const rawApi = process.env.NEXT_PUBLIC_API_URL || defaultBase;

    if (!rawApi) {
      return null;
    }

    const wsBase = rawApi.replace(/^http(s)?/, (_, s) => (s ? "wss" : "ws"));
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
        } catch {}
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
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.shouldReconnect) {
        this.connect(this.stationId);
      }
    }, delay);
  }
}

export const wsClient = new AuroraWebSocketClient();

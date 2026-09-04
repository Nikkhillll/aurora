/**
 * Station Snapshot Export Utility for AURORA.
 * Exports multi-domain Antarctic operations snapshots to RFC-4180 CSV and printable PDF reports.
 * Covers Environment, Energy, Infrastructure, Logistics, and optional active alerts.
 */

import type { TelemetrySnapshotPayload, AlertPayload } from "@/lib/wsClient";

/**
 * Escape a CSV field according to RFC-4180.
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate and trigger download of an RFC-4180 compliant CSV snapshot.
 */
export function exportSnapshotToCSV(
  snapshot: TelemetrySnapshotPayload,
  stationName: string = snapshot.station_id.toUpperCase(),
  activeAlerts: AlertPayload[] = []
): void {
  const timestamp = snapshot.timestamp || new Date().toISOString();
  const safeStation = snapshot.station_id.toLowerCase();

  const lines: string[] = [];

  // Header / Metadata
  lines.push("# AURORA — Antarctic Unified Operations & Risk Analytics");
  lines.push("# Station Telemetry Snapshot Report");
  lines.push(`Station,${escapeCSV(stationName)}`);
  lines.push(`Station_ID,${escapeCSV(snapshot.station_id)}`);
  lines.push(`Snapshot_Timestamp_UTC,${escapeCSV(timestamp)}`);
  lines.push("");

  // Domain 1: Environment
  lines.push("--- ENVIRONMENT DOMAIN ---");
  lines.push("Metric,Value,Unit,Status");
  lines.push(`Temperature,${escapeCSV(snapshot.environment.temperature_c)},deg C,${escapeCSV(snapshot.environment.status)}`);
  lines.push(`Wind_Speed,${escapeCSV(snapshot.environment.wind_speed_ms)},m/s,${escapeCSV(snapshot.environment.status)}`);
  lines.push(`Atmospheric_Pressure,${escapeCSV(snapshot.environment.pressure_hpa)},hPa,${escapeCSV(snapshot.environment.status)}`);
  lines.push(`Visibility,${escapeCSV(snapshot.environment.visibility_km)},km,${escapeCSV(snapshot.environment.status)}`);
  lines.push(`Domain_Status,${escapeCSV(snapshot.environment.status)},-,${escapeCSV(snapshot.environment.status)}`);
  lines.push("");

  // Domain 2: Energy
  lines.push("--- ENERGY DOMAIN ---");
  lines.push("Metric,Value,Unit,Status");
  lines.push(`Battery_Level,${escapeCSV(snapshot.energy.battery_level_pct)},%,${escapeCSV(snapshot.energy.status)}`);
  lines.push(`Power_Generation,${escapeCSV(snapshot.energy.generation_kw)},kW,${escapeCSV(snapshot.energy.status)}`);
  lines.push(`Power_Consumption,${escapeCSV(snapshot.energy.consumption_kw)},kW,${escapeCSV(snapshot.energy.status)}`);
  lines.push(`Projected_Endurance,${escapeCSV(snapshot.energy.projected_hours_remaining)},hours,${escapeCSV(snapshot.energy.status)}`);
  lines.push(`Domain_Status,${escapeCSV(snapshot.energy.status)},-,${escapeCSV(snapshot.energy.status)}`);
  lines.push("");

  // Domain 3: Infrastructure
  lines.push("--- INFRASTRUCTURE DOMAIN ---");
  lines.push("Component,Value/Status,Details");
  lines.push(`Equipment_Health,${escapeCSV(snapshot.infrastructure.equipment_health_pct)}%,Health Index`);
  lines.push(`Building_Condition,${escapeCSV(snapshot.infrastructure.building_condition)},Structural State`);
  if (snapshot.infrastructure.zones && snapshot.infrastructure.zones.length > 0) {
    snapshot.infrastructure.zones.forEach((z) => {
      lines.push(`Zone_${escapeCSV(z.name)},${escapeCSV(z.status)},Zone ID: ${escapeCSV(z.id)}`);
    });
  }
  lines.push(`Domain_Status,${escapeCSV(snapshot.infrastructure.status)},Overall`);
  lines.push("");

  // Domain 4: Logistics
  lines.push("--- LOGISTICS DOMAIN ---");
  lines.push("Resource,Level/Count,Status,Next Resupply");
  lines.push(`Fuel_Reserve,${escapeCSV(snapshot.logistics.fuel_level_pct)}%,${escapeCSV(snapshot.logistics.status)},${escapeCSV(snapshot.logistics.next_resupply)}`);
  lines.push(`Supplies_Reserve,${escapeCSV(snapshot.logistics.supplies_level_pct)}%,${escapeCSV(snapshot.logistics.status)},${escapeCSV(snapshot.logistics.next_resupply)}`);
  lines.push(`Spare_Parts,${escapeCSV(snapshot.logistics.spare_parts_count)} units,${escapeCSV(snapshot.logistics.status)},${escapeCSV(snapshot.logistics.next_resupply)}`);
  lines.push(`Domain_Status,${escapeCSV(snapshot.logistics.status)},Overall,-`);
  lines.push("");

  // Optional Section: Active Alerts
  if (activeAlerts && activeAlerts.length > 0) {
    lines.push("--- ACTIVE RISK ALERTS ---");
    lines.push("Alert_ID,Severity,Title,Message,Timestamp");
    activeAlerts.forEach((a) => {
      lines.push(
        `${escapeCSV(a.id)},${escapeCSV(a.severity)},${escapeCSV(a.title || "")},${escapeCSV(a.message)},${escapeCSV(a.created_at || timestamp)}`
      );
    });
  }

  const csvContent = lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const cleanStamp = timestamp.replace(/[:.]/g, "-");
  link.setAttribute("href", url);
  link.setAttribute("download", `AURORA_Snapshot_${safeStation}_${cleanStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a printable Antarctic Station Status Report.
 * Uses browser print API to output a high-fidelity PDF without external dependencies.
 */
export function exportSnapshotToPrintableReport(
  snapshot: TelemetrySnapshotPayload,
  stationName: string = snapshot.station_id.toUpperCase(),
  activeAlerts: AlertPayload[] = []
): void {
  const timestamp = snapshot.timestamp || new Date().toISOString();

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocker prevented report generation. Please allow popups for AURORA.");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AURORA Status Report — ${stationName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #FFFFFF;
      color: #0F172A;
      margin: 0;
      padding: 32px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0F172A;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748B;
      margin: 4px 0 0 0;
    }
    .meta {
      text-align: right;
      font-family: monospace;
      font-size: 12px;
      color: #475569;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 16px;
      background: #F8FAFC;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px 0;
      border-bottom: 1px dotted #E2E8F0;
    }
    .label {
      color: #64748B;
    }
    .value {
      font-weight: 600;
      font-family: monospace;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-nominal { background: #DCFCE7; color: #166534; }
    .status-warning { background: #FEF3C7; color: #92400E; }
    .status-critical { background: #FEE2E2; color: #991B1B; }
    .alerts-section {
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 16px;
      background: #FFF;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      font-size: 11px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">AURORA · Station Status Report</h1>
      <p class="subtitle">Antarctic Unified Operations & Risk Analytics · MoES / NCPOR</p>
    </div>
    <div class="meta">
      <div><strong>Station:</strong> ${stationName}</div>
      <div><strong>Generated:</strong> ${timestamp}</div>
      <div><strong>Security:</strong> NCPOR RESTRICTED</div>
    </div>
  </div>

  <div class="grid">
    <!-- Environment -->
    <div class="card">
      <h3 class="card-title">1. Environment Domain</h3>
      <div class="row"><span class="label">Temperature</span><span class="value">${snapshot.environment.temperature_c} °C</span></div>
      <div class="row"><span class="label">Wind Speed</span><span class="value">${snapshot.environment.wind_speed_ms} m/s</span></div>
      <div class="row"><span class="label">Pressure</span><span class="value">${snapshot.environment.pressure_hpa} hPa</span></div>
      <div class="row"><span class="label">Visibility</span><span class="value">${snapshot.environment.visibility_km} km</span></div>
      <div class="row"><span class="label">Domain Health</span><span class="value status-badge status-${snapshot.environment.status}">${snapshot.environment.status}</span></div>
    </div>

    <!-- Energy -->
    <div class="card">
      <h3 class="card-title">2. Energy Domain</h3>
      <div class="row"><span class="label">Battery Bank</span><span class="value">${snapshot.energy.battery_level_pct}%</span></div>
      <div class="row"><span class="label">Generation</span><span class="value">${snapshot.energy.generation_kw} kW</span></div>
      <div class="row"><span class="label">Consumption</span><span class="value">${snapshot.energy.consumption_kw} kW</span></div>
      <div class="row"><span class="label">Projected Endurance</span><span class="value">${snapshot.energy.projected_hours_remaining} hrs</span></div>
      <div class="row"><span class="label">Domain Health</span><span class="value status-badge status-${snapshot.energy.status}">${snapshot.energy.status}</span></div>
    </div>

    <!-- Infrastructure -->
    <div class="card">
      <h3 class="card-title">3. Infrastructure Domain</h3>
      <div class="row"><span class="label">Equipment Health</span><span class="value">${snapshot.infrastructure.equipment_health_pct}%</span></div>
      <div class="row"><span class="label">Structure State</span><span class="value">${snapshot.infrastructure.building_condition}</span></div>
      <div class="row"><span class="label">Monitored Zones</span><span class="value">${snapshot.infrastructure.zones?.length || 3} zones online</span></div>
      <div class="row"><span class="label">Domain Health</span><span class="value status-badge status-${snapshot.infrastructure.status}">${snapshot.infrastructure.status}</span></div>
    </div>

    <!-- Logistics -->
    <div class="card">
      <h3 class="card-title">4. Logistics Domain</h3>
      <div class="row"><span class="label">Fuel Reserve</span><span class="value">${snapshot.logistics.fuel_level_pct}%</span></div>
      <div class="row"><span class="label">General Supplies</span><span class="value">${snapshot.logistics.supplies_level_pct}%</span></div>
      <div class="row"><span class="label">Critical Spare Parts</span><span class="value">${snapshot.logistics.spare_parts_count} units</span></div>
      <div class="row"><span class="label">Next Resupply Window</span><span class="value">${snapshot.logistics.next_resupply}</span></div>
      <div class="row"><span class="label">Domain Health</span><span class="value status-badge status-${snapshot.logistics.status}">${snapshot.logistics.status}</span></div>
    </div>
  </div>

  ${
    activeAlerts.length > 0
      ? `
  <div class="alerts-section">
    <h3 class="card-title" style="color: #991B1B;">Active Risk Alerts (${activeAlerts.length})</h3>
    ${activeAlerts
      .map(
        (a) => `
      <div class="row" style="padding: 6px 0;">
        <span class="value status-badge status-${a.severity === 'critical' || a.severity === 'high' ? 'critical' : 'warning'}">${a.severity}</span>
        <span style="flex: 1; margin: 0 12px; font-weight: 500;">${a.title ? `<strong>${a.title}</strong> — ` : ''}${a.message}</span>
        <span class="value" style="color: #64748B; font-size: 11px;">${a.id}</span>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <div class="footer">
    <span>National Centre for Polar and Ocean Research (NCPOR) · Ministry of Earth Sciences</span>
    <span>AURORA SIH26060 · Station Digital Twin</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

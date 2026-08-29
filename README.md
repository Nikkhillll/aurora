<div align="center">

# AURORA
### Antarctic Unified Operations & Risk Analytics

**A predictive Digital Twin dashboard for unified remote management of Indian Antarctic Research Stations**

Built for **Smart India Hackathon 2026** · Problem Statement **SIH26060**
Ministry of Earth Sciences (MoES) · National Centre for Polar and Ocean Research (NCPOR)

<br/>

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Status](https://img.shields.io/badge/status-MVP-F5A524?style=for-the-badge)
![License](https://img.shields.io/badge/license-Hackathon-8592A3?style=for-the-badge)

<br/>

**[Live Demo](#)** · **[Problem Statement](#-problem-statement)** · **[Getting Started](#-getting-started)** · **[Team](#-team)**

</div>

<br/>

---

## Overview

Maitri and Bharati stations currently run on **fragmented, siloed monitoring** — environment, energy, infrastructure, and logistics data live in separate systems with no unified view. AURORA is a **Digital Twin platform** that pulls all four domains into one operational picture, turns raw telemetry into **forecasts and risk alerts**, and lets operators **simulate scenarios** before committing to a decision.

<div align="center">

```
   OBSERVE  →  PREDICT  →  SIMULATE  →  RECOMMEND  →  ACT
   real-time    AI          what-if       alerts &      operational
   & historical forecasts   scenarios     actions       teams respond
   data
```

</div>

Unlike conventional dashboards that just display numbers, AURORA predicts **cascading risk** — a storm doesn't just mean bad weather, it means projected battery drain, resupply pressure, and equipment strain, all connected.

---

## Problem Statement

<table>
<tr><td><b>ID</b></td><td>SIH26060</td></tr>
<tr><td><b>Title</b></td><td>Digital Platform for efficient remote management of Indian Antarctic Research Stations</td></tr>
<tr><td><b>Organization</b></td><td>Ministry of Earth Sciences (MoES)</td></tr>
<tr><td><b>Department</b></td><td>National Centre for Polar and Ocean Research (NCPOR)</td></tr>
<tr><td><b>Category</b></td><td>Software</td></tr>
<tr><td><b>Description</b></td><td>Develop a Digital Twin framework for Maitri and Bharati stations integrating infrastructure, energy, logistics and environmental monitoring for efficient remote management.</td></tr>
</table>

---

## Feature Status

<table>
<tr>
<th align="left">Module</th>
<th align="left">Status</th>
<th align="left">Description</th>
</tr>
<tr>
<td>🌐 Station toggle</td>
<td>✅ Done</td>
<td>Switch between Maitri ↔ Bharati with live coordinates & UTC clock</td>
</tr>
<tr>
<td>🌡️ Environment card</td>
<td>✅ Done</td>
<td>Temperature & pressure dial gauges, wind speed, weather risk badge</td>
</tr>
<tr>
<td>⚡ Energy card</td>
<td>✅ Done</td>
<td>Battery dial gauge, solar/wind generation, generator status</td>
</tr>
<tr>
<td>🚨 Alerts panel</td>
<td>✅ Done</td>
<td>Severity-coded risk alerts — high / medium / low</td>
</tr>
<tr>
<td>🎛️ What-if simulator</td>
<td>✅ Done</td>
<td>Interactive storm-severity slider with live battery-drain projection</td>
</tr>
<tr>
<td>📊 Segmented status strip</td>
<td>✅ Done</td>
<td>At-a-glance health across all four domains</td>
</tr>
<tr>
<td>🏗️ Infrastructure card</td>
<td>🔲 Placeholder</td>
<td>Equipment health, building condition, zone status</td>
</tr>
<tr>
<td>📦 Logistics card</td>
<td>🔲 Placeholder</td>
<td>Fuel, supplies, spare parts, resupply window</td>
</tr>
<tr>
<td>📈 Trend charts</td>
<td>🔲 Placeholder</td>
<td>Temperature & battery history over time</td>
</tr>
</table>

---

## Tech Stack

<div align="center">

| Layer | Technology |
|:--|:--|
| **Framework** | Next.js 16 (App Router · Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 (`@theme inline` design tokens) |
| **Charts** | Recharts |
| **Icons** | lucide-react |
| **Fonts** | Inter (UI) · JetBrains Mono (telemetry) |
| **Deployment** | Vercel |

</div>

> **Planned for full build:** FastAPI · InfluxDB · PostgreSQL · MQTT · scikit-learn / XGBoost — see [Roadmap](#roadmap)

---

## Design System

AURORA follows a **flat, mission-control aesthetic** — no gradients, no glow, no unnecessary noise.

<div align="center">

| Token | Color | Usage |
|:--|:--:|:--|
| `bg-base` | `#0B0F14` | Polar night — app background |
| `bg-card` | `#131A24` | Card surfaces |
| `accent-env` | 🔵 `#4CC9F0` | Environment — always cyan |
| `accent-energy` | 🟠 `#FFB84D` | Energy — always amber |
| `status-nominal` | 🟢 `#34D399` | Healthy / normal |
| `status-warning` | 🟡 `#F5A524` | Needs attention |
| `status-critical` | 🔴 `#F5484F` | Immediate risk |

</div>

**Rules:** color is semantic only · 12px rounded corners everywhere · JetBrains Mono for every number, timestamp, and coordinate · Inter for labels and body text · dial gauges over generic charts wherever a single value matters.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/Nikkhillll/aurora.git
cd aurora
npm install
```

### Run locally

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**

### Build for production

```bash
npm run build
```

---

## Project Structure

```
aurora/
├── app/
│   ├── layout.tsx              Root layout, fonts, metadata
│   ├── page.tsx                 Main dashboard assembly
│   └── globals.css              AURORA design tokens
│
├── components/
│   ├── DialGauge.tsx             Shared SVG dial gauge
│   ├── EnvironmentCard.tsx       Temperature · pressure · wind · risk
│   ├── EnergyCard.tsx            Battery · solar/wind · generator
│   ├── InfrastructureCard.tsx    Equipment · building · zone status
│   ├── LogisticsCard.tsx         Fuel · supplies · resupply window
│   ├── AlertsPanel.tsx           Severity-coded risk alerts
│   ├── WhatIfSimulator.tsx       Interactive scenario slider
│   └── Charts/
│       ├── TempTrendChart.tsx
│       ├── BatteryTrendChart.tsx
│       └── SimulationChart.tsx
│
└── data/
    └── mockData.ts               Shared mock data — Maitri & Bharati
```

---

## Team

<div align="center">

**ASTRA MeridianX**

Nikhil · Saubhagya · Sarthak · Ayush · Shambhavi · Aditya

</div>

---

## Roadmap

- [ ] FastAPI backend — REST + WebSocket endpoints
- [ ] InfluxDB (time-series) + PostgreSQL (relational) data layer
- [ ] MQTT-based simulated IoT sensor ingestion
- [ ] ML forecasting models — energy load, weather risk, equipment failure
- [ ] Real cascading-risk simulation engine
- [ ] Role-based access control (RBAC) and authentication
- [ ] Infrastructure & Logistics cards — full implementation
- [ ] Trend history charts — temperature & battery
- [ ] Notification system and report export

---

<div align="center">

**From reactive monitoring to proactive Antarctic operations.**

<sub>Built with ❄️ for Smart India Hackathon 2026</sub>

</div>
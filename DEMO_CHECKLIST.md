# AURORA — Demo Day Readiness Checklist

**Smart India Hackathon 2026** · Problem Statement **SIH26060**  
**Team:** ASTRA MeridianX  
**Role:** Person 6 (Auth, Admin, Notifications, Export & QA)

---

## 1. Pre-Flight System Setup

- [ ] **Backend Environment Initialized**
  ```bash
  cd backend
  .venv\Scripts\activate
  uvicorn app.main:app --port 8000
  ```
- [ ] **Frontend Development Server Running**
  ```bash
  npm run dev
  ```
- [ ] **Health Endpoint Responding**
  - Verify `http://localhost:8000/health` returns `{"ok": true, "version": "1.0.0", "ml_ready": false, ...}`
- [ ] **Pre-Seeded Demo Credentials Verified**
  - **Administrator:** `admin@aurora.ncpor.res.in` / `Admin@Aurora2026!`
  - **Operator:** `operator@aurora.ncpor.res.in` / `Operator@Aurora2026!`
  *(Note: Credentials can be customized via `AURORA_ADMIN_PASSWORD` / `AURORA_OPERATOR_PASSWORD` environment variables)*

---

## 2. Live Demo Flow Walkthrough

### Step 1: Authentication & Access Control
- [ ] **Log in as Station Operator (`operator@aurora.ncpor.res.in`)**
  - Verify access to main mission-control dashboard.
  - Verify Admin Console tab is restricted / hidden.
- [ ] **Attempt Invalid Password Login**
  - Verify 401 Unauthorized safe error message.
  - Verify audit event recorded in backend log.

### Step 2: Station Telemetry & Multi-Domain Operations
- [ ] **Inspect Maitri Station**
  - Coordinates: `-70.766° S, 11.731° E`
  - 4 Operational Domains: Environment (Cyan), Energy (Amber), Infrastructure, Logistics.
  - Segmented status strip shows nominal / warning states.
- [ ] **Switch Station: Maitri ↔ Bharati**
  - Coordinates update to Bharati: `-69.407° S, 76.187° E`.
  - Live charts and gauges switch immediately.

### Step 3: What-If Cascading Risk Simulation
- [ ] **Select Scenario:** `Storm` / `Equipment Failure` / `Resupply Delay`.
- [ ] **Adjust Severity Slider (e.g. 65% Severity)**:
  - Projected battery endurance drops in real-time.
  - Plain-language narrative explains cascading consequence across domains.
  - Simulation trajectory chart renders 24-hour drain curve.

### Step 4: Real-Time Operational Notifications
- [ ] **WebSocket Live Connection Active (`/ws/live`)**
  - Status indicator displays green connected state.
- [ ] **Trigger / Receive Risk Alert**
  - Notification badge counter increments.
  - Toast banner pops up with severity color code and timestamp.
  - Click notification to mark as read or dismiss.

### Step 5: Station Status Snapshot Export
- [ ] **Export CSV Snapshot**
  - Click `[ Export CSV ]`.
  - Verify downloaded file: `AURORA_Snapshot_maitri_*.csv`.
  - Open file: validates RFC-4180 headers for Environment, Energy, Infrastructure, Logistics.
- [ ] **Export PDF Status Report**
  - Click `[ Export PDF ]` / `[ Print Report ]`.
  - Browser printable status report renders with clean NCPOR formatting and domain summary tables.

### Step 6: NCPOR Admin Console & Audit Trail
- [ ] **Log in as Station Director (`admin@aurora.ncpor.res.in`)**
  - Open NCPOR Admin Console.
  - View User Directory: lists active operators and administrators.
  - Click `[ Provision Account ]` → Create new field researcher account.
  - Toggle user active / deactivated status.
  - Inspect Security Audit Trail: filter by `LOGIN_SUCCESS`, `USER_CREATED`, `ROLE_CHANGED`.

---

## 3. Fallback & Resilience Checklist

- [ ] **Backend Offline Resilience:** Frontend falls back gracefully to local calculations if backend connection drops mid-presentation.
- [ ] **Single Worker Process:** Backend uvicorn runs with 1 worker to preserve in-memory state and WebSocket connections.
- [ ] **Demo Data Identification:** Clearly communicate that environmental data reflects NCPOR stations while operational telemetry is simulated for SIH demonstration.

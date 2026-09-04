# Person 1 Integration & Hand-off Guide

**From:** Person 6 (Frontend UI/UX, Landing Page, Auth, Admin, Notifications, Export & QA)  
**To:** Person 1 (Core Architecture & System Assembly)  
**Branch:** `feat/person-6-auth-admin-export`

---

## 1. Information Architecture & Target Routes

The frontend now features a complete, professional, SIH-ready route structure:

| Route | Purpose | Component / File |
|:---|:---|:---|
| `/` | Public-facing Polar Mission Landing Page (<30s value pitch, SIH overview, 5-stage loop, 4 domains, interactive demo scenario, Ask AURORA) | [`components/LandingPage/index.tsx`](file:///c:/Users/LOQ/Desktop/aurora/components/LandingPage/index.tsx) via [`app/page.tsx`](file:///c:/Users/LOQ/Desktop/aurora/app/page.tsx) |
| `/dashboard` | Live Mission Control Dashboard (Station telemetry, dial gauges, trend charts, What-If simulator, notifications tray, export) | [`components/Dashboard.tsx`](file:///c:/Users/LOQ/Desktop/aurora/components/Dashboard.tsx) via [`app/dashboard/page.tsx`](file:///c:/Users/LOQ/Desktop/aurora/app/dashboard/page.tsx) |
| `/login` | Dedicated NCPOR Terminal Sign-In Route | [`app/login/page.tsx`](file:///c:/Users/LOQ/Desktop/aurora/app/login/page.tsx) |
| `/admin` | Admin Console route (User management, RBAC role control, security audit trail) | [`app/admin/page.tsx`](file:///c:/Users/LOQ/Desktop/aurora/app/admin/page.tsx) |

---

## 2. Landing Page Component Architecture (`components/LandingPage/`)

All landing page sections are isolated, modular, and adhere to AURORA's dark mission-control design language:

1. **`LandingNav.tsx`**: Polar coordinates (`70.77°S 11.73°E`), live indicator, section anchors, "Ask AURORA", and primary "Launch Dashboard" button.
2. **`LandingHero.tsx`**: Headline *"Command clarity at Antarctic distances"*, supporting context, SIH26060 badge, live UTC clock, and interactive command-center telemetry widget.
3. **`ProblemSolution.tsx`**: Side-by-side legacy fragmented silos vs. AURORA Unified Digital Twin comparison.
4. **`HowItWorks.tsx`**: 5-step operational loop (*Observe → Predict → Simulate → Recommend → Act*) with sensor inputs and outputs.
5. **`DomainMonitoring.tsx`**: Interactive 4-domain deep dive (Environment, Energy & Microgrid, Infrastructure, Logistics) with real metrics and hardware feeds.
6. **`DemoScenario.tsx`**: Interactive SIH blizzard stress-test walkthrough with live severity slider and battery runtime forecast recalculation.
7. **`StationComparison.tsx`**: Maitri vs. Bharati specifications, coordinates, power generation, and comparative metrics.
8. **`TrustCapabilities.tsx`**: WebSockets, ML twin, RBAC, cryptographic audit logs, PDF/CSV export, and offline resiliency.
9. **`AskAuroraAssistant.tsx`**: Standalone guided operational assistant with verified prompt pills covering stations, forecasting, sensors, RBAC, and SIH26060.
10. **`TeamSection.tsx`**: Team ASTRA MeridianX 6-member engineering breakdown aligned with MoES / NCPOR / SIH 2026.
11. **`LandingFooter.tsx`**: NCPOR / MoES attribution, GitHub repository link, mailto contact CTA, and legal bar.

---

## 3. Backend Router Inclusion (`backend/app/main.py`)

In `backend/app/main.py`, the auth router is included at line 28:

```python
# Person 6 Auth & Admin Router
from app.auth import router as auth_router
app.include_router(auth_router)
```

---

## 4. Route Protection Strategy (When `REQUIRE_AUTH=True`)

To enforce operator access on backend routes without changing signatures:

```python
from fastapi import Depends
from app.auth import require_operator, require_admin

# Protect Station / Telemetry / Alerts / Simulation routes:
@router.get("/stations", dependencies=[Depends(require_operator)])
def list_stations(): ...

@router.get("/stations/{station_id}/snapshot", dependencies=[Depends(require_operator)])
def get_snapshot(station_id: str): ...

@router.get("/telemetry/{station_id}", dependencies=[Depends(require_operator)])
def get_telemetry(...): ...

@router.get("/alerts/{station_id}", dependencies=[Depends(require_operator)])
def get_alerts(...): ...

@router.post("/alerts/{alert_id}/ack", dependencies=[Depends(require_operator)])
def ack_alert(...): ...

@router.post("/simulate", dependencies=[Depends(require_operator)])
def simulate(...): ...
```

*Note: `GET /health`, `POST /auth/signup`, `POST /auth/login`, and `POST /ingest` (which uses `X-Gateway-Key`) remain public.*

---

## 5. Seed Credentials for Local Development & Demo

- **Admin Account:** `admin@aurora.ncpor.res.in` / `Admin@Aurora2026!`
- **Operator Account:** `operator@aurora.ncpor.res.in` / `Operator@Aurora2026!`
- **Lead Scientist:** `scientist@aurora.ncpor.res.in` / `Scientist@Aurora2026!`
- **Logistics Analyst:** `analyst@aurora.ncpor.res.in` / `Analyst@Aurora2026!`

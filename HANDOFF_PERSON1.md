# Person 1 Integration & Hand-off Guide

**From:** Person 6 (Auth, Admin, Notifications, Export & QA)  
**To:** Person 1 (Core Backend & Dashboard Assembly)  
**Branch:** `feat/person-6-auth-admin-export`

---

## 1. Backend Router Inclusion (`backend/app/main.py`)

In `backend/app/main.py`, uncomment / add the auth router inclusion at lines 28–30:

```python
# Person 6 Auth & Admin Router
from app.auth import router as auth_router
app.include_router(auth_router)
```

---

## 2. Dependency Manifest Additions (`backend/requirements.txt`)

When updating `backend/requirements.txt`, add the following two packages:

```text
PyJWT>=2.8.0
bcrypt>=4.0.0
```

---

## 3. Route Protection Strategy (When `REQUIRE_AUTH=True`)

To enforce operator access on existing routes without changing function signatures:

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

## 4. WebSocket Authentication Validation (`backend/app/routers/ws.py`)

To optionally enforce token validation on WebSocket connections:

```python
from app.auth.dependencies import validate_ws_token

@router.websocket("/ws/live")
async def live(
    websocket: WebSocket,
    station_id: str | None = None,
    token: str | None = None,
):
    # Optional auth validation if REQUIRE_AUTH is enabled
    # user = validate_ws_token(token)
    await ws_manager.connect(websocket, station_id)
    ...
```

---

## 5. Frontend Integration Snippets (`app/page.tsx`)

### A. Mount Notifications & Export in Header

```tsx
import Notifications from "@/components/Notifications";
import AdminConsole from "@/components/AdminConsole";
import { exportSnapshotToCSV, exportSnapshotToPrintableReport } from "@/utils/export";
import { getStoredUser } from "@/lib/authClient";
import { Download, Printer, Shield } from "lucide-react";

// Inside Home component:
const [showAdmin, setShowAdmin] = useState(false);
const currentUser = getStoredUser();

// In Header action bar:
<div className="flex items-center gap-2">
  {/* Export Controls */}
  <button
    onClick={() => exportSnapshotToCSV(currentSnapshot, station.name, stationAlerts)}
    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-border bg-bg-card hover:bg-border/50 text-text-primary transition-colors"
    title="Export CSV Telemetry Snapshot"
  >
    <Download size={13} />
    CSV
  </button>
  
  <button
    onClick={() => exportSnapshotToPrintableReport(currentSnapshot, station.name, stationAlerts)}
    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-border bg-bg-card hover:bg-border/50 text-text-primary transition-colors"
    title="Generate Printable Status Report (PDF)"
  >
    <Printer size={13} />
    PDF
  </button>

  {/* Live Real-Time Notifications Tray */}
  <Notifications stationId={activeStation} />

  {/* Admin Console Toggle (if Admin user) */}
  {currentUser?.role === "admin" && (
    <button
      onClick={() => setShowAdmin(!showAdmin)}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-[#4CC9F0]/40 bg-[#4CC9F0]/10 text-[#4CC9F0] hover:bg-[#4CC9F0]/20 transition-colors"
    >
      <Shield size={13} />
      Admin Console
    </button>
  )}
</div>

{/* Conditionally render Admin Console modal / section */}
{showAdmin && (
  <div className="px-4 py-4 sm:px-6">
    <AdminConsole currentUser={currentUser} onClose={() => setShowAdmin(false)} />
  </div>
)}
```

---

## 6. Seed Credentials for Local Development

- **Admin Account:** `admin@aurora.ncpor.res.in` / `Admin@Aurora2026!`
- **Operator Account:** `operator@aurora.ncpor.res.in` / `Operator@Aurora2026!`

Configurable via environment variables:
- `AURORA_ADMIN_PASSWORD`
- `AURORA_OPERATOR_PASSWORD`
- `JWT_SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

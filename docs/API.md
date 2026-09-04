# AURORA — API contract v1

Owner: Person 1 (Integration Lead). This document is the single source of truth for
how frontend, gateway, ML, and simulation talk to the backend.

**Any change to a request or response shape gets posted in team chat immediately —
not at merge time.** If you are consuming an API, keep your fetch calls in one
clearly-named file so a renamed field is a one-line fix.

---

## Global conventions

These apply to every endpoint. Read them once, then you can predict most shapes.

| Rule | Value |
|---|---|
| JSON casing | `snake_case` everywhere |
| Timestamps | ISO-8601, UTC, trailing `Z` — e.g. `2026-09-04T10:22:31Z` |
| Status values | `nominal` \| `warning` \| `critical` (maps 1:1 to design tokens) |
| Risk levels | `low` \| `medium` \| `high` |
| Station IDs | `maitri` \| `bharati` (lowercase, stable) |
| Units | Encoded in the field name: `_c`, `_pct`, `_ms`, `_hpa`, `_kw`, `_km` |
| Errors | `{ "detail": "human readable message" }` with a 4xx/5xx status |

Base URLs (Vercel env vars — Person 2, 5, 6 use these, never hardcode):

```
NEXT_PUBLIC_API_URL   https://<app>.up.railway.app
NEXT_PUBLIC_WS_URL    wss://<app>.up.railway.app
```

---

## GET /health

Liveness check. Used by Railway and by anyone debugging "is the backend up".

```json
{ "ok": true, "ml_ready": true, "influx_ready": true, "version": "1.0.0" }
```

---

## GET /stations

Powers the Maitri ↔ Bharati toggle.

```json
[
  {
    "id": "maitri",
    "name": "Maitri",
    "coordinates": { "lat": -70.766, "lon": 11.731 },
    "status": "nominal",
    "personnel_count": 25,
    "last_updated": "2026-09-04T10:22:31Z"
  },
  {
    "id": "bharati",
    "name": "Bharati",
    "coordinates": { "lat": -69.407, "lon": 76.187 },
    "status": "warning",
    "personnel_count": 47,
    "last_updated": "2026-09-04T10:22:29Z"
  }
]
```

---

## GET /stations/{id}/snapshot

**The main dashboard call.** Returns all four instrument cards in one request, so
page load is one fetch instead of four. The WebSocket pushes this exact same shape,
which means the frontend has one render path for both initial load and live updates.

`404` if the station id is unknown.

```json
{
  "station_id": "maitri",
  "timestamp": "2026-09-04T10:22:31Z",
  "environment": {
    "temperature_c": -32.4,
    "wind_speed_ms": 18.2,
    "pressure_hpa": 981.3,
    "visibility_km": 2.1,
    "status": "warning"
  },
  "energy": {
    "battery_level_pct": 64.0,
    "generation_kw": 12.4,
    "consumption_kw": 15.1,
    "projected_hours_remaining": 9.5,
    "status": "warning"
  },
  "infrastructure": {
    "equipment_health_pct": 88,
    "building_condition": "stable",
    "zones": [
      { "id": "z1", "name": "Hab block",    "status": "nominal" },
      { "id": "z2", "name": "Power module", "status": "warning" },
      { "id": "z3", "name": "Lab wing",     "status": "nominal" }
    ],
    "status": "nominal"
  },
  "logistics": {
    "fuel_level_pct": 71,
    "supplies_level_pct": 58,
    "spare_parts_count": 143,
    "next_resupply": "2026-11-12",
    "status": "nominal"
  }
}
```

Notes for **Person 2**: every block carries its own `status` — bind the card's
badge colour to that field, don't recompute thresholds in the frontend.
`building_condition` is a free string (`stable` / `minor wear` / `needs inspection`).
`next_resupply` is a plain date, no time component.

---

## GET /telemetry/{station_id}

Historical series for the trend charts.

Query params:

| Param | Type | Default | Notes |
|---|---|---|---|
| `metric` | string | required | `temperature` \| `battery_level` \| `wind_speed` \| `pressure` |
| `hours` | int | `24` | Lookback window, max `168` |

```json
{
  "station_id": "maitri",
  "metric": "temperature",
  "unit": "C",
  "points": [
    { "time": "2026-09-04T09:00:00Z", "value": -31.2 },
    { "time": "2026-09-04T09:05:00Z", "value": -31.6 }
  ]
}
```

Notes for **Person 2**: `points` is already sorted oldest → newest and safe to feed
straight into Recharts. Chart X axis = `time`, Y axis = `value`. Same shape for both
charts, so `TempTrendChart` and `BatteryTrendChart` can share one data-fetch hook.

---

## GET /alerts/{station_id}

Sorted newest first. Backed by ML output once Person 4's models land; rule-based
until then. `source` tells you which produced it.

```json
[
  {
    "id": "a_01",
    "station_id": "maitri",
    "severity": "critical",
    "title": "Battery reserve below threshold",
    "message": "Projected 4.2 hours remaining at current drain rate.",
    "source": "ml",
    "created_at": "2026-09-04T10:19:02Z",
    "acknowledged": false
  }
]
```

`severity` uses the same three values as `status`, so **Person 5** can map it
directly onto `text-status-critical` / `warning` / `nominal`.

`POST /alerts/{alert_id}/ack` → `{ "id": "a_01", "acknowledged": true }`

---

## POST /simulate

The what-if centrepiece. Runs the scenario through the ML models and returns a real
projection plus an hour-by-hour timeline for the chart.

Request:

```json
{ "station_id": "maitri", "scenario": "storm", "severity": 60 }
```

`scenario` is `storm` \| `equipment_failure` \| `resupply_delay`.
`severity` is an integer `0–100`.

Response:

```json
{
  "station_id": "maitri",
  "scenario": "storm",
  "severity": 60,
  "baseline":  { "battery_hours_remaining": 18.2, "risk_level": "low" },
  "projected": { "battery_hours_remaining": 7.4,  "risk_level": "high" },
  "timeline": [
    { "hour": 0, "battery_pct": 64.0 },
    { "hour": 1, "battery_pct": 61.2 },
    { "hour": 2, "battery_pct": 58.1 }
  ],
  "narrative": "At 60% storm severity, wind generation drops roughly 70% while heating load rises. Battery endurance falls from 18.2 to 7.4 hours."
}
```

Notes for **Person 5**: `timeline` is what `SimulationChart` renders — X axis `hour`,
Y axis `battery_pct`. `baseline` vs `projected` gives you the before/after comparison
without a second request. `narrative` is a ready-made sentence for the judges.
Debounce the slider ~150ms so you aren't firing a request per pixel.

---

## POST /ingest

Person 3's edge gateway posts here. Not called by the frontend.

Header: `X-Gateway-Key: <shared secret>`

```json
{
  "station_id": "maitri",
  "timestamp": "2026-09-04T10:22:31Z",
  "readings": {
    "temperature": -31.2,
    "battery_level": 64.0,
    "wind_speed": 18.2,
    "pressure": 981.3
  }
}
```

Response `202`: `{ "accepted": true, "station_id": "maitri" }`

`readings` keys are all optional — send whatever the gateway has. Unknown keys are
ignored rather than rejected, so adding a sensor later doesn't break ingestion.
Every accepted reading triggers a WebSocket broadcast.

---

## WS /ws/live

Connect: `wss://<host>/ws/live?station_id=maitri`

Server pushes messages in this envelope. Switch on `type`.

```json
{ "type": "telemetry", "payload": { /* identical to /snapshot response */ } }
```

```json
{ "type": "alert",     "payload": { /* identical to one /alerts item */ } }
```

```json
{ "type": "pong" }
```

Client sends `{"type":"ping"}` every 30s to keep the connection alive through
Railway's idle timeout.

Notes: **Person 2** listens for `telemetry` and swaps the card data.
**Person 6** listens for `alert` and fires the toast. Both share one socket —
don't open two connections.

---

## Auth (Person 6, added last)

`POST /auth/signup`, `POST /auth/login` → `{ "access_token": "...", "token_type": "bearer", "role": "operator" }`

Protected routes take `Authorization: Bearer <token>`.

While building, the backend runs with `REQUIRE_AUTH=false` so nobody is blocked by a
login screen. It flips to `true` near the end.

### Roles — clarified

The original plan said "operator (view-only)," but the dashboard already includes
actions — acknowledging alerts, running simulations. Those aren't administrative,
they're normal operational duties, so:

- **`operator`** — full dashboard access: view all data, acknowledge alerts, run
  `/simulate`. Cannot manage users or view the audit log.
- **`admin`** — everything `operator` can do, plus user management and audit log
  access (`AdminConsole.tsx`).

So "view-only" only ever meant *view-only relative to admin*, not read-only overall.

### WebSocket auth

Browsers can't set an `Authorization` header on a native WebSocket connection.
Decision: pass the JWT as a query param on connect —

```
wss://<host>/ws/live?station_id=maitri&token=<jwt>
```

Reasoning: the socket only pushes `telemetry` and `alert` broadcasts — it never
accepts state-changing commands from the client — so the security surface here is
"who can see live data," not "who can act." A query-param token is enough for that,
and it's the fastest to implement correctly on a hackathon timeline. Cookie-based
auth would be more production-grade but adds a second auth mechanism alongside the
Bearer-token REST flow, which isn't worth the complexity here.

### Persistence timing

Build against an **in-memory demo store** now — same pattern as `services/state.py`
already uses for telemetry. Label it clearly (`# DEMO STORE — swap for Postgres`) so
it's obvious it's temporary. Swap to real Postgres once that's stood up; keep the
function signatures identical (`create_user`, `get_user_by_email`, `log_audit_event`
etc.) so the swap is a one-file change, not a rewrite. This mirrors how
`ml_bridge.py` already falls back to heuristics until Person 4's models land —
same philosophy, don't block on infrastructure that isn't ready yet.

### Export

**Client-side**, generated from `GET /stations/{id}/snapshot` — that endpoint
already returns everything a status snapshot needs. No new backend endpoint
required. Use a frontend library (e.g. `jspdf` for PDF, or a simple CSV
stringifier) inside `utils/export.ts`. Keeps this fully in Person 6's own file,
no coordination needed, no extra backend surface to maintain before the demo.

---

## Change log

| Date | Change | Posted in chat |
|---|---|---|
| — | v1 initial contract | |

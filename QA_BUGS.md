# AURORA QA Test Matrix & Bug Tracking Log

**Project:** AURORA — Antarctic Unified Operations & Risk Analytics  
**SIH Problem Statement:** SIH26060  
**Owner:** Person 6 (Auth, Admin, Notifications, Export & QA)  
**Branch:** `feat/person-6-auth-admin-export`

---

## 1. QA Test Matrix

| Test ID | Domain | Test Scenario | Expected Outcome | Result |
|---|---|---|---|---|
| **AUTH-001** | Auth | Valid Admin Login (`POST /auth/login`) | Status 200, returns JWT access token, `role: admin`, updates `last_login` timestamp | **PASS** |
| **AUTH-002** | Auth | Valid Operator Login (`POST /auth/login`) | Status 200, returns JWT access token, `role: operator` | **PASS** |
| **AUTH-003** | Auth | Invalid Password Login | Status 401 Unauthorized, records `LOGIN_FAILED` in audit log | **PASS** |
| **AUTH-004** | Auth | Non-existent Email Login | Status 401 Unauthorized | **PASS** |
| **AUTH-005** | Auth | Public Signup (`POST /auth/signup`) | Status 201 Created, enforces `operator` role even if payload requests `admin` | **PASS** |
| **AUTH-006** | Auth | Fetch Profile with valid Bearer (`GET /auth/me`) | Status 200, returns profile of logged-in user | **PASS** |
| **AUTH-007** | Auth | Fetch Profile with missing Bearer | Status 401 Unauthorized | **PASS** |
| **AUTH-008** | Auth | Fetch Profile with expired Bearer | Status 401 Unauthorized (`Token has expired`) | **PASS** |
| **AUTH-009** | Auth / RBAC | Access with Deactivated User Account | **Status 403 Forbidden** immediately, even if holding an unexpired JWT | **PASS** |
| **RBAC-001** | RBAC | Admin queries User Directory (`GET /admin/users`) | Status 200, returns all registered station users | **PASS** |
| **RBAC-002** | RBAC | Operator queries User Directory (`GET /admin/users`) | **Status 403 Forbidden** | **PASS** |
| **RBAC-003** | RBAC | Operator queries Audit Trail (`GET /admin/audit-logs`) | **Status 403 Forbidden** | **PASS** |
| **ADMIN-001**| Admin | Admin creates user (`POST /admin/users`) | Status 201, user provisioned with assigned role, records `USER_CREATED` audit event | **PASS** |
| **ADMIN-002**| Admin | Admin toggles user status (`PATCH /admin/users/{id}/status`) | Status 200, user activated/deactivated, logs audit event | **PASS** |
| **ADMIN-003**| Admin | Safeguard: Deactivate last active admin | **Status 400 Bad Request**, operation rejected, logs `STATUS_CHANGE_REJECTED` audit | **PASS** |
| **ADMIN-004**| Admin | Safeguard: Demote last active admin | **Status 400 Bad Request**, operation rejected, logs `ROLE_CHANGE_REJECTED` audit | **PASS** |
| **NOTIF-001**| Real-Time | WebSocket connect with JWT (`/ws/live?token=...`) | Connected, receives initial station telemetry snapshot | **PASS** |
| **NOTIF-002**| Real-Time | Live alert broadcast via `/ingest` | Broadcast received, triggers notification tray & pop-up toast banner | **PASS** |
| **NOTIF-003**| Real-Time | Alert deduplication & dismiss | Identical alert IDs deduplicated, unread counter decrements on mark-as-read | **PASS** |
| **EXP-001**  | Export | CSV Station Snapshot Export | Downloads RFC-4180 compliant CSV with Environment, Energy, Infrastructure, Logistics | **PASS** |
| **EXP-002**  | Export | Printable Status Report Export | Opens clean high-density printable window for instant browser PDF generation | **PASS** |
| **BUILD-001**| Frontend | Next.js Production Turbopack Build | Compiles with 0 TypeScript/Turbopack errors | **PASS** |

---

## 2. Tracked Cross-Functional Bugs & Issues

### BUG-001: Active station not propagated to WhatIfSimulator
- **Severity:** P2 (Moderate Functional)
- **Component:** `components/WhatIfSimulator.tsx` / `app/page.tsx`
- **Owner:** Person 1 (Integration) / Person 5 (UI)
- **Description:** `app/page.tsx` mounts `<WhatIfSimulator onSeverityChange={setSeverity} />` without passing the `station={stationKey}` prop. As a result, `WhatIfSimulator` defaults to `maitri` even when Bharati station is selected.
- **Suggested Fix:** Pass `station={stationKey}` prop in `app/page.tsx:289`.

### BUG-002: Scenario selection in WhatIfSimulator does not sync to SimulationChart
- **Severity:** P2 (Moderate Functional)
- **Component:** `components/WhatIfSimulator.tsx` / `components/Charts/SimulationChart.tsx`
- **Owner:** Person 1 (Integration) / Person 5 (UI)
- **Description:** `WhatIfSimulator` allows choosing scenarios (`storm`, `equipment_failure`, `resupply_delay`), but `page.tsx` only passes `severity` to `SimulationChart`. The chart therefore always simulates the `storm` scenario.
- **Suggested Fix:** Lift `scenario` state to `page.tsx` or pass scenario change callback.

### BUG-003: Alert severity schema mismatch between backend and frontend
- **Severity:** P2 (Moderate Integration)
- **Component:** `backend/app/services/alerts.py` vs `components/AlertsPanel.tsx`
- **Owner:** Person 1 (Contract) / Person 5 (Alerts UI)
- **Description:** Backend alerts use `severity: "critical" | "warning"` with `title` and `acknowledged`. `AlertsPanel.tsx` expects `severity: "high" | "medium" | "low"`.
- **Status in Person 6 work:** Person 6 implemented a universal adapter in `lib/wsClient.ts` and `components/Notifications.tsx` that supports both formats smoothly.

### BUG-004: ESLint state-in-effect warning in WhatIfSimulator
- **Severity:** P3 (Cosmetic/Lint)
- **Component:** `components/WhatIfSimulator.tsx:38:5`
- **Owner:** Person 5 (Simulator UI)
- **Description:** Synchronous `setLoading(true)` inside `useEffect` triggers `react-hooks/set-state-in-effect` during `npm run lint`.
- **Suggested Fix:** Move `setLoading(true)` outside the synchronous effect body or use a transition/loading state.

### BUG-005: Missing docs/API.md in root checkout
- **Severity:** P3 (Documentation)
- **Owner:** Person 1
- **Description:** `backend/README.md` references `docs/API.md` as the contract source of truth, but the directory was absent from the initial repository checkout.
- **Status in Person 6 work:** Comprehensive API route table and integration hand-off documented in `HANDOFF_PERSON1.md`.

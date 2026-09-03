# AURORA backend

FastAPI service. Contract lives in `docs/API.md` at the repo root — that is the
source of truth, this file is just how to run it.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs
Health check:     http://localhost:8000/health

## Quick verification

```bash
curl localhost:8000/health
curl localhost:8000/stations
curl "localhost:8000/telemetry/maitri?metric=temperature&hours=24"
curl -X POST localhost:8000/simulate -H 'Content-Type: application/json' \
  -d '{"station_id":"maitri","scenario":"storm","severity":60}'
```

## Notes for the team

**Seeded data.** On startup the service generates 7 days of plausible history for
both stations, so trend charts and simulations work before the IoT pipeline exists.
Real readings from `POST /ingest` overwrite live values and append to history.

**ML fallback.** `services/ml_bridge.py` tries to import `ml.predict`. If it isn't
there yet, it uses heuristics and `/health` reports `ml_ready: false`. Nothing 500s
either way. Person 4 only needs to match two signatures:

```python
predict_battery_hours(state: dict) -> float
predict_storm_risk(conditions: dict) -> str   # "low" | "medium" | "high"
```

**Single worker, deliberately.** Live state and the WebSocket client set are
in-process. Do not add `--workers 2`.

**Where things go.** Routers stay thin and delegate to `services/`. Add endpoints in
`routers/`, add logic in `services/`. Person 6's auth router gets exactly one
`include_router` line in `main.py`, added by Person 1.

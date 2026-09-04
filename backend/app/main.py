import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGIN_REGEX, ALLOWED_ORIGINS, REQUIRE_AUTH, VERSION
from app.routers import alerts, ingest, simulate, stations, telemetry, ws
from app.services import ml_bridge, state, ws_manager

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="AURORA API", version=VERSION,
              description="Antarctic Unified Operations & Risk Analytics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,  # covers Vercel preview deploys
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (stations, telemetry, alerts, simulate, ingest, ws):
    app.include_router(module.router)

from app.auth import router as auth_router
app.include_router(auth_router.router)


@app.on_event("startup")
def startup():
    state.seed()
    logging.getLogger("aurora").info(
        "AURORA API v%s up | ml_ready=%s | auth=%s",
        VERSION, ml_bridge.ML_READY, REQUIRE_AUTH,
    )


@app.get("/health", tags=["meta"])
def health():
    return {
        "ok": True,
        "version": VERSION,
        "ml_ready": ml_bridge.ML_READY,
        "influx_ready": False,
        "ws_clients": ws_manager.client_count(),
    }

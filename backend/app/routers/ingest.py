from fastapi import APIRouter, Header, HTTPException

from app.config import GATEWAY_KEY
from app.schemas import IngestPayload
from app.services import alerts, state, ws_manager

router = APIRouter(tags=["ingest"])


@router.post("/ingest", status_code=202)
async def ingest(payload: IngestPayload, x_gateway_key: str = Header(default="")):
    if x_gateway_key != GATEWAY_KEY:
        raise HTTPException(401, "Invalid or missing X-Gateway-Key")
    if payload.station_id not in state.STATIONS:
        raise HTTPException(404, f"Unknown station '{payload.station_id}'")

    snap = state.apply_reading(payload.station_id, payload.readings)
    await ws_manager.broadcast({"type": "telemetry", "payload": snap}, payload.station_id)

    for alert in alerts.evaluate(payload.station_id):
        await ws_manager.broadcast({"type": "alert", "payload": alert}, payload.station_id)

    return {"accepted": True, "station_id": payload.station_id}

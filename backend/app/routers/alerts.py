from fastapi import APIRouter, HTTPException

from app.services import alerts, state

router = APIRouter(tags=["alerts"])


@router.get("/alerts/{station_id}")
def get_alerts(station_id: str):
    if station_id not in state.STATIONS:
        raise HTTPException(404, f"Unknown station '{station_id}'")
    return alerts.listing(station_id)


@router.post("/alerts/{alert_id}/ack")
def ack_alert(alert_id: str):
    result = alerts.acknowledge(alert_id)
    if not result:
        raise HTTPException(404, f"Unknown alert '{alert_id}'")
    return {"id": result["id"], "acknowledged": True}

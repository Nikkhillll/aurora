from fastapi import APIRouter, HTTPException, Query

from app.services import state

router = APIRouter(tags=["telemetry"])

UNITS = {"temperature": "C", "battery_level": "%", "wind_speed": "m/s", "pressure": "hPa"}


@router.get("/telemetry/{station_id}")
def get_telemetry(
    station_id: str,
    metric: str = Query(..., description="temperature | battery_level | wind_speed | pressure"),
    hours: int = Query(24, ge=1, le=168),
):
    if station_id not in state.STATIONS:
        raise HTTPException(404, f"Unknown station '{station_id}'")
    if metric not in state.METRICS:
        raise HTTPException(400, f"Unknown metric '{metric}'. Valid: {', '.join(state.METRICS)}")
    return {
        "station_id": station_id,
        "metric": metric,
        "unit": UNITS[metric],
        "points": state.history(station_id, metric, hours),
    }

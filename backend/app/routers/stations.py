from fastapi import APIRouter, HTTPException

from app.services import state

router = APIRouter(tags=["stations"])


@router.get("/stations")
def list_stations():
    return [
        {**meta,
         "status": state.station_status(sid),
         "last_updated": state.snapshot(sid)["timestamp"]}
        for sid, meta in state.STATIONS.items()
    ]


@router.get("/stations/{station_id}")
def get_station(station_id: str):
    if station_id not in state.STATIONS:
        raise HTTPException(404, f"Unknown station '{station_id}'")
    return {**state.STATIONS[station_id],
            "status": state.station_status(station_id),
            "last_updated": state.snapshot(station_id)["timestamp"]}


@router.get("/stations/{station_id}/snapshot")
def get_snapshot(station_id: str):
    if station_id not in state.STATIONS:
        raise HTTPException(404, f"Unknown station '{station_id}'")
    return state.snapshot(station_id)

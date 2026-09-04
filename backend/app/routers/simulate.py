from fastapi import APIRouter, HTTPException

from app.schemas import SimulateRequest
from app.services import simulation, state

router = APIRouter(tags=["simulate"])


@router.post("/simulate")
def simulate(req: SimulateRequest):
    if req.station_id not in state.STATIONS:
        raise HTTPException(404, f"Unknown station '{req.station_id}'")
    return simulation.run(req.station_id, req.scenario, req.severity)

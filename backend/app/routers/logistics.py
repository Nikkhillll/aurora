from datetime import datetime

from fastapi import APIRouter, HTTPException

from ..services.sea_ice import SeaIceSeasonalModel

from ..services.routes import RESUPPLY_ROUTES


router = APIRouter(prefix="/api/logistics", tags=["logistics"])

ice_model = SeaIceSeasonalModel()


@router.get("/ice-risk")
async def get_ice_risk(station: str):
    """
    Get derived sea-ice risk for a resupply route.
    """

    route = RESUPPLY_ROUTES.get(station)

    if not route:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown station: {station}",
        )

    risk = ice_model.check_route_risk(
        list(route["waypoints"]),
        month=datetime.now().month,
    )

    return {
        **risk,
        "route_name": route["name"],
        "data_tier": "derived",
        "data_source": "NSIDC seasonal climatology (not live feed)",
    }


@router.get("/resupply-schedule/{station}")
async def get_resupply_schedule(station: str):
    """
    Get the planned resupply schedule for a station.
    """

    route = RESUPPLY_ROUTES.get(station)

    if not route:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown station: {station}",
        )

    return {
        "station": station,
        "next_resupply_date": "2026-11-15",
        "route": route["name"],
        "distance_km": route["total_distance_km"],
        "typical_duration_days": route["typical_duration_days"],
        "ship_status": "not_yet_departed",
    }
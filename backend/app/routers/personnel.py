from fastapi import APIRouter

router = APIRouter(
    prefix="/api/personnel",
    tags=["personnel"],
)

# Operational station rule:
# If heating fails, personnel have a 6-hour safe evacuation window.
SAFE_EVACUATION_HOURS = 6

# Demo/simulation state.
# This resets to ONLINE when the backend restarts.
heating_failed = False


@router.get("/safety")
def get_personnel_safety():
    return {
        "totalPersonnel": 42,
        "onSite": 39,
        "onLeave": 3,
        "heatingStatus": "failed" if heating_failed else "online",
        "safeEvacuationHours": SAFE_EVACUATION_HOURS,
        "exposureHours": 1,
    }


@router.post("/heating")
def set_heating_status(failed: bool):
    global heating_failed

    heating_failed = failed

    return {
        "heatingStatus": "failed" if heating_failed else "online",
        "safeEvacuationHours": SAFE_EVACUATION_HOURS,
    }
"""
The seam between the backend and Person 4's models.

If ml/predict.py exists and exposes the agreed functions, we use it.
If it doesn't, we fall back to transparent heuristics so /simulate and /alerts
never 500 in front of a judge. Person 4 only has to match two signatures:

    predict_battery_hours(state: dict) -> float
    predict_storm_risk(conditions: dict) -> str   # "low" | "medium" | "high"
"""
import logging

from app.services import state

log = logging.getLogger("aurora.ml")

try:
    from ml.predict import predict_battery_hours, predict_storm_risk  # type: ignore
    ML_READY = True
    log.info("ML models loaded from ml.predict")
except Exception as exc:  # ImportError, or the module raising on import
    ML_READY = False
    log.warning("ML models unavailable (%s) - using heuristic fallback", exc)


def battery_hours(snap: dict) -> float:
    if ML_READY:
        try:
            return round(float(predict_battery_hours(snap)), 1)
        except Exception:
            log.exception("predict_battery_hours failed, falling back")
    return state.endurance_hours(snap["energy"])


def storm_risk(snap: dict) -> str:
    if ML_READY:
        try:
            return str(predict_storm_risk(snap["environment"]))
        except Exception:
            log.exception("predict_storm_risk failed, falling back")
    env = snap["environment"]
    if env["wind_speed_ms"] > 25 or env["pressure_hpa"] < 970:
        return "high"
    if env["wind_speed_ms"] > 15 or env["pressure_hpa"] < 980:
        return "medium"
    return "low"

"""Alert generation. Rule-based now, ML-sourced once Person 4's models land."""
import itertools

from app.services import ml_bridge, state

_ALERTS: dict[str, list[dict]] = {}
_ids = itertools.count(1)


def _add(station_id: str, severity: str, title: str, message: str) -> dict | None:
    existing = _ALERTS.setdefault(station_id, [])
    if any(a["title"] == title and not a["acknowledged"] for a in existing):
        return None  # don't spam the same open alert every tick
    alert = {
        "id": f"a_{next(_ids):03d}",
        "station_id": station_id,
        "severity": severity,
        "title": title,
        "message": message,
        "source": "ml" if ml_bridge.ML_READY else "rule",
        "created_at": state.now_iso(),
        "acknowledged": False,
    }
    existing.insert(0, alert)
    return alert


def evaluate(station_id: str, snap: dict | None = None) -> list[dict]:
    """Run after every ingest, or with a hypothetical snapshot from simulation."""
    if snap is None:
        snap = state.snapshot(station_id)
    new = []
    hours = ml_bridge.battery_hours(snap)
    risk = ml_bridge.storm_risk(snap)

    if hours < 6:
        new.append(_add(station_id, "critical", "Battery reserve below threshold",
                        f"Projected {hours}h remaining at current drain rate."))
    elif hours < 12:
        new.append(_add(station_id, "warning", "Battery endurance declining",
                        f"Projected {hours}h remaining. Review non-essential load."))

    if risk == "high":
        new.append(_add(station_id, "critical", "High storm risk",
                        f"Wind {snap['environment']['wind_speed_ms']} m/s, "
                        f"pressure {snap['environment']['pressure_hpa']} hPa."))
    elif risk == "medium":
        new.append(_add(station_id, "warning", "Elevated storm risk",
                        "Conditions trending toward storm thresholds."))

    if snap["logistics"]["fuel_level_pct"] < 25:
        new.append(_add(station_id, "critical", "Fuel level critical",
                        f"Fuel at {snap['logistics']['fuel_level_pct']}%."))

    return [a for a in new if a]


def listing(station_id: str) -> list[dict]:
    return _ALERTS.get(station_id, [])


def acknowledge(alert_id: str) -> dict | None:
    for alerts in _ALERTS.values():
        for a in alerts:
            if a["id"] == alert_id:
                a["acknowledged"] = True
                return a
    return None

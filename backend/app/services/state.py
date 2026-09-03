"""
Single in-memory source of truth for current station state.

Why in-memory: the dashboard reads from here, so it stays instant and keeps
working even if Postgres/Influx hiccup mid-demo. Database writes happen on top
of this as best-effort, never in the read path.
"""
import math
import random
from collections import deque
from datetime import datetime, timedelta, timezone

METRICS = ("temperature", "battery_level", "wind_speed", "pressure")
HISTORY_POINTS = 2016  # 7 days at 5-minute resolution

# Endurance forecasts are clamped to this ceiling. Applied to BOTH the charging
# and discharging branches - if only the charging branch is capped, a mild storm
# can report more hours than no storm at all.
MAX_FORECAST_HOURS = 72.0
BANK_KWH = 120.0  # usable battery bank

STATIONS = {
    "maitri": {
        "id": "maitri",
        "name": "Maitri",
        "coordinates": {"lat": -70.766, "lon": 11.731},
        "personnel_count": 25,
    },
    "bharati": {
        "id": "bharati",
        "name": "Bharati",
        "coordinates": {"lat": -69.407, "lon": 76.187},
        "personnel_count": 47,
    },
}

_LIVE: dict[str, dict] = {}
_HISTORY: dict[tuple[str, str], deque] = {}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _blank(station_id: str) -> dict:
    return {
        "station_id": station_id,
        "timestamp": now_iso(),
        "environment": {
            "temperature_c": -30.0,
            "wind_speed_ms": 8.0,
            "pressure_hpa": 985.0,
            "visibility_km": 10.0,
            "status": "nominal",
        },
        "energy": {
            "battery_level_pct": 80.0,
            "generation_kw": 14.0,
            "consumption_kw": 12.0,
            "projected_hours_remaining": 24.0,
            "status": "nominal",
        },
        "infrastructure": {
            "equipment_health_pct": 92,
            "building_condition": "stable",
            "zones": [
                {"id": "z1", "name": "Hab block", "status": "nominal"},
                {"id": "z2", "name": "Power module", "status": "nominal"},
                {"id": "z3", "name": "Lab wing", "status": "nominal"},
            ],
            "status": "nominal",
        },
        "logistics": {
            "fuel_level_pct": 74,
            "supplies_level_pct": 61,
            "spare_parts_count": 143,
            "next_resupply": "2026-11-12",
            "status": "nominal",
        },
    }


def _worst(*statuses: str) -> str:
    order = {"nominal": 0, "warning": 1, "critical": 2}
    return max(statuses, key=lambda s: order.get(s, 0))


def endurance_hours(energy: dict) -> float:
    """
    Hours of battery left. Single implementation shared by recompute() and the
    ML fallback so the two can never disagree.
    """
    net = energy["generation_kw"] - energy["consumption_kw"]
    if net >= 0:
        return MAX_FORECAST_HOURS
    hours = (energy["battery_level_pct"] / 100 * BANK_KWH) / abs(net)
    return round(min(hours, MAX_FORECAST_HOURS), 1)


def recompute(snap: dict) -> None:
    """Derive every status field from raw values. Frontend never does this itself."""
    env, en = snap["environment"], snap["energy"]

    env["status"] = (
        "critical" if env["wind_speed_ms"] > 25 or env["temperature_c"] < -38
        else "warning" if env["wind_speed_ms"] > 15 or env["visibility_km"] < 3
        else "nominal"
    )

    en["projected_hours_remaining"] = endurance_hours(en)

    en["status"] = (
        "critical" if en["battery_level_pct"] < 20 or en["projected_hours_remaining"] < 6
        else "warning" if en["battery_level_pct"] < 40 or en["projected_hours_remaining"] < 12
        else "nominal"
    )

    infra, log = snap["infrastructure"], snap["logistics"]
    infra["status"] = (
        "critical" if infra["equipment_health_pct"] < 60
        else "warning" if infra["equipment_health_pct"] < 80
        else "nominal"
    )
    lowest = min(log["fuel_level_pct"], log["supplies_level_pct"])
    log["status"] = "critical" if lowest < 20 else "warning" if lowest < 40 else "nominal"


def station_status(station_id: str) -> str:
    s = snapshot(station_id)
    return _worst(*(s[k]["status"] for k in
                    ("environment", "energy", "infrastructure", "logistics")))


def apply_reading(station_id: str, readings: dict) -> dict:
    """Fold one gateway reading into live state. Unknown keys ignored by design."""
    snap = _LIVE.setdefault(station_id, _blank(station_id))
    snap["timestamp"] = now_iso()

    mapping = {
        "temperature": ("environment", "temperature_c"),
        "wind_speed": ("environment", "wind_speed_ms"),
        "pressure": ("environment", "pressure_hpa"),
        "visibility": ("environment", "visibility_km"),
        "battery_level": ("energy", "battery_level_pct"),
        "generation": ("energy", "generation_kw"),
        "consumption": ("energy", "consumption_kw"),
    }
    for key, value in readings.items():
        if key in mapping:
            block, field = mapping[key]
            snap[block][field] = round(float(value), 2)
        if key in METRICS:
            _push_history(station_id, key, snap["timestamp"], float(value))

    recompute(snap)
    return snap


def snapshot(station_id: str) -> dict:
    return _LIVE.setdefault(station_id, _blank(station_id))


def _push_history(station_id: str, metric: str, time: str, value: float) -> None:
    key = (station_id, metric)
    if key not in _HISTORY:
        _HISTORY[key] = deque(maxlen=HISTORY_POINTS)
    _HISTORY[key].append({"time": time, "value": round(value, 2)})


def history(station_id: str, metric: str, hours: int) -> list[dict]:
    points = list(_HISTORY.get((station_id, metric), []))
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    out = []
    for p in points:
        try:
            t = datetime.fromisoformat(p["time"].replace("Z", "+00:00"))
        except ValueError:
            continue
        if t >= cutoff:
            out.append(p)
    return out


def seed() -> None:
    """
    Pre-fill 7 days of plausible history so the trend charts render on day one,
    before Person 3's simulator is running. Replaced by real data as it arrives.
    """
    random.seed(42)
    base = {
        "maitri":  {"temperature": -30.0, "battery_level": 78.0, "wind_speed": 9.0,  "pressure": 985.0},
        "bharati": {"temperature": -24.0, "battery_level": 64.0, "wind_speed": 13.0, "pressure": 979.0},
    }
    start = datetime.now(timezone.utc) - timedelta(hours=168)

    for sid, centres in base.items():
        _LIVE[sid] = _blank(sid)
        for i in range(HISTORY_POINTS):
            t = start + timedelta(minutes=5 * i)
            stamp = t.isoformat(timespec="seconds").replace("+00:00", "Z")
            # daily sine cycle + gentle noise = believable, not random walk chaos
            phase = math.sin(2 * math.pi * (i % 288) / 288)
            for metric, centre in centres.items():
                amp = {"temperature": 4.0, "battery_level": 12.0,
                       "wind_speed": 5.0, "pressure": 6.0}[metric]
                value = centre + amp * phase + random.uniform(-amp * 0.15, amp * 0.15)
                if metric == "battery_level":
                    value = max(15.0, min(100.0, value))
                if metric == "wind_speed":
                    value = max(0.0, value)
                _push_history(sid, metric, stamp, value)

        last = {m: _HISTORY[(sid, m)][-1]["value"] for m in centres}
        apply_reading(sid, last)

"""
AURORA Edge Gateway — Telemetry Validator & Preprocessor
=========================================================
Person 3 · Simulated IoT / Data Ingestion Pipeline

Validates schema, data types, physical sensor ranges, and extracts
station IDs from incoming MQTT telemetry messages. Performs lightweight
preprocessing (rounding, timestamp normalization).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


REQUIRED_FIELDS = {
    "station_id",
    "timestamp",
    "temperature",
    "battery",
    "wind",
    "pressure",
}

# Physical bounds for validation sanity checks (Antarctic research station)
SENSOR_BOUNDS = {
    "temperature": (-100.0, 50.0),    # °C: -100°C to +50°C
    "battery": (0.0, 100.0),          # %: 0% to 100%
    "wind": (0.0, 300.0),             # km/h: non-negative, up to category 5 hurricane/katabatic winds
    "pressure": (800.0, 1150.0),      # hPa: standard Antarctic range ≈ 940-1030 hPa
}


@dataclass
class ValidationResult:
    """Outcome of telemetry schema and boundary validation."""
    valid: bool
    data: Optional[Dict[str, Any]] = None
    station_id: Optional[str] = None
    errors: List[str] = field(default_factory=list)

    def summary(self) -> str:
        """Formatted string summary of validation result."""
        if self.valid:
            return "VALID"
        return f"INVALID ({'; '.join(self.errors)})"


def extract_station_id_from_topic(topic: str) -> Optional[str]:
    """
    Extract station ID from MQTT topic string.
    Expected pattern: aurora/stations/<station_id>/sensors
    """
    match = re.match(r"^aurora/stations/([^/]+)/sensors$", topic)
    if match:
        return match.group(1).strip()
    return None


def validate_and_preprocess(raw_data: Any, topic: Optional[str] = None) -> ValidationResult:
    """
    Validate and preprocess incoming MQTT telemetry payload.

    Checks:
    1. Payload is a valid dictionary/object.
    2. All 6 required fields are present.
    3. Types and formats:
       - station_id: non-empty string matching topic if topic is provided.
       - timestamp: valid ISO-8601 format.
       - temperature, battery, wind, pressure: numeric and within physical bounds.
    4. Lightweight preprocessing:
       - Float casting and rounding to 2 decimal places.
       - Standardized ISO UTC timestamp string.

    Returns:
        ValidationResult with status and sanitized data or error list.
    """
    errors: List[str] = []

    if not isinstance(raw_data, dict):
        return ValidationResult(
            valid=False,
            errors=[f"Payload root must be a JSON object, got {type(raw_data).__name__}"],
        )

    # 1. Missing fields check
    missing = REQUIRED_FIELDS - set(raw_data.keys())
    if missing:
        errors.append(f"Missing required field(s): {', '.join(sorted(missing))}")

    if errors:
        return ValidationResult(valid=False, errors=errors)

    # 2. Station ID validation
    station_id = raw_data.get("station_id")
    if not isinstance(station_id, str) or not station_id.strip():
        errors.append(f"station_id must be a non-empty string, got {repr(station_id)}")
    else:
        station_id = station_id.strip()

    # If topic was provided, verify station ID consistency
    if topic:
        topic_station = extract_station_id_from_topic(topic)
        if topic_station and station_id and topic_station.lower() != station_id.lower():
            errors.append(
                f"station_id mismatch: payload '{station_id}' does not match topic '{topic_station}'"
            )

    # 3. Timestamp validation
    raw_ts = raw_data.get("timestamp")
    normalized_ts: Optional[str] = None
    if not isinstance(raw_ts, str) or not raw_ts.strip():
        errors.append(f"timestamp must be a non-empty ISO-8601 string, got {repr(raw_ts)}")
    else:
        try:
            # Handle ISO string with trailing Z or timezone offset
            cleaned_ts = raw_ts.strip().replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned_ts)
            # Ensure UTC timezone awareness
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            normalized_ts = dt.isoformat()
        except (ValueError, TypeError) as exc:
            errors.append(f"Invalid ISO-8601 timestamp '{raw_ts}': {exc}")

    # 4. Sensor values validation & lightweight preprocessing
    sanitized_sensors: Dict[str, float] = {}
    for sensor_name, (min_val, max_val) in SENSOR_BOUNDS.items():
        val = raw_data.get(sensor_name)

        # Check for bool explicitly since bool is a subclass of int in Python
        if isinstance(val, bool) or not isinstance(val, (int, float)):
            errors.append(
                f"Field '{sensor_name}' must be numeric, got {type(val).__name__} ({repr(val)})"
            )
            continue

        numeric_val = float(val)

        # Range bounds sanity check
        if not (min_val <= numeric_val <= max_val):
            errors.append(
                f"Sensor '{sensor_name}' value {numeric_val} is out of physical range [{min_val}, {max_val}]"
            )
            continue

        # Lightweight preprocessing: round to 2 decimals
        sanitized_sensors[sensor_name] = round(numeric_val, 2)

    if errors:
        return ValidationResult(
            valid=False,
            station_id=station_id if isinstance(station_id, str) else None,
            errors=errors,
        )

    # Construct clean preprocessed data
    preprocessed_data: Dict[str, Any] = {
        "station_id": station_id,
        "timestamp": normalized_ts,
        "temperature": sanitized_sensors["temperature"],
        "battery": sanitized_sensors["battery"],
        "wind": sanitized_sensors["wind"],
        "pressure": sanitized_sensors["pressure"],
    }

    return ValidationResult(
        valid=True,
        data=preprocessed_data,
        station_id=station_id,
        errors=[],
    )

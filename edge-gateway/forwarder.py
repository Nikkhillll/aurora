"""
AURORA Edge Gateway — Backend Forwarder
========================================
Person 3 · Simulated IoT / Data Ingestion Pipeline

Transfers validated and preprocessed telemetry to Person 1's FastAPI backend
via HTTP POST /ingest using the confirmed contract schema and authentication.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("aurora.edge_gateway.forwarder")

# ---------------------------------------------------------------------------
# Contract Constants (Provided by Person 1)
# ---------------------------------------------------------------------------

DEFAULT_BACKEND_URL = "http://localhost:8000/ingest"
DEFAULT_GATEWAY_KEY = "aurora-dev-key"
DEFAULT_TIMEOUT_SECONDS = 3.0
HEADER_KEY_NAME = "X-Gateway-Key"


def transform_telemetry_for_backend(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform validated MQTT telemetry into Person 1 backend ingestion schema.

    Source (Gateway validated):
    {
        "station_id": "maitri",
        "timestamp": "2026-09-04T10:22:31+00:00",
        "temperature": -31.2,
        "battery": 64.0,
        "wind": 18.2,
        "pressure": 981.3
    }

    Target (Person 1 Backend /ingest):
    {
        "station_id": "maitri",
        "timestamp": "2026-09-04T10:22:31Z",
        "readings": {
            "temperature": -31.2,
            "battery_level": 64.0,
            "wind_speed": 18.2,
            "pressure": 981.3
        }
    }
    """
    station_id = telemetry.get("station_id")
    raw_ts = telemetry.get("timestamp")

    # Format timestamp to ISO-8601 UTC with 'Z' suffix if present
    formatted_ts: Optional[str] = None
    if isinstance(raw_ts, str) and raw_ts.strip():
        formatted_ts = raw_ts.strip().replace("+00:00", "Z")

    readings: Dict[str, float] = {}

    # Map fields to Person 1 contract keys:
    # temperature -> readings.temperature
    # battery     -> readings.battery_level
    # wind        -> readings.wind_speed
    # pressure    -> readings.pressure
    if "temperature" in telemetry and telemetry["temperature"] is not None:
        readings["temperature"] = float(telemetry["temperature"])
    if "battery" in telemetry and telemetry["battery"] is not None:
        readings["battery_level"] = float(telemetry["battery"])
    if "wind" in telemetry and telemetry["wind"] is not None:
        readings["wind_speed"] = float(telemetry["wind"])
    if "pressure" in telemetry and telemetry["pressure"] is not None:
        readings["pressure"] = float(telemetry["pressure"])

    payload: Dict[str, Any] = {
        "station_id": station_id,
        "readings": readings,
    }
    if formatted_ts:
        payload["timestamp"] = formatted_ts

    return payload


class BackendForwarder:
    """
    HTTP Forwarder connecting Edge Gateway to Person 1 FastAPI backend.

    Attributes:
        endpoint_url: Target URL (http://localhost:8000/ingest)
        gateway_key: Authentication header value for X-Gateway-Key
        timeout: Request timeout in seconds
        enabled: Whether forwarding is enabled
    """

    def __init__(
        self,
        endpoint_url: str = DEFAULT_BACKEND_URL,
        gateway_key: str = DEFAULT_GATEWAY_KEY,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        enabled: bool = True,
    ) -> None:
        self.endpoint_url = endpoint_url
        self.gateway_key = gateway_key
        self.timeout = timeout
        self.enabled = enabled

        # Telemetry metrics
        self.total_forwarded = 0
        self.total_success = 0
        self.total_failed = 0

    def forward(
        self,
        telemetry: Dict[str, Any],
        override_key: Optional[str] = None,
        override_url: Optional[str] = None,
    ) -> Tuple[bool, Optional[int], Optional[str]]:
        """
        Transform and POST telemetry payload to Person 1's backend.

        Args:
            telemetry: Validated dictionary from validator.py
            override_key: Optional custom key (for error testing without changing default)
            override_url: Optional custom url (for error testing)

        Returns:
            Tuple[bool, Optional[int], Optional[str]]:
                (success, status_code, response_body_or_error_message)
        """
        if not self.enabled:
            logger.debug("[FORWARDER] Forwarding is disabled. Skipping.")
            return True, None, "disabled"

        self.total_forwarded += 1

        # 1. Transform payload
        payload_data = transform_telemetry_for_backend(telemetry)
        station_id = payload_data.get("station_id", "unknown")
        url = override_url or self.endpoint_url
        key = override_key if override_key is not None else self.gateway_key

        try:
            body_bytes = json.dumps(payload_data).encode("utf-8")
        except (TypeError, ValueError) as exc:
            self.total_failed += 1
            error_msg = f"Failed to serialize transformed payload: {exc}"
            logger.error(f"[FORWARDER] {error_msg}")
            return False, None, error_msg

        # 2. Build HTTP request
        req = urllib.request.Request(
            url=url,
            data=body_bytes,
            headers={
                "Content-Type": "application/json",
                HEADER_KEY_NAME: key,
                "User-Agent": "AURORA-Edge-Gateway/1.0",
            },
            method="POST",
        )

        # 3. Dispatch HTTP POST
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                status_code = response.status
                raw_response = response.read().decode("utf-8")

                if status_code == 202:
                    self.total_success += 1
                    logger.info(
                        f"[FORWARDER] SUCCESS: Forwarded station '{station_id}' telemetry "
                        f"to {url} (HTTP 202 Accepted: {raw_response.strip()})"
                    )
                    return True, status_code, raw_response
                else:
                    # Non-202 2xx response
                    self.total_success += 1
                    logger.info(
                        f"[FORWARDER] Forwarded station '{station_id}' to {url} "
                        f"(HTTP {status_code}: {raw_response.strip()})"
                    )
                    return True, status_code, raw_response

        except urllib.error.HTTPError as exc:
            self.total_failed += 1
            status_code = exc.code
            try:
                error_body = exc.read().decode("utf-8")
            except Exception:
                error_body = str(exc.reason)

            if status_code == 401:
                logger.warning(
                    f"[FORWARDER] HTTP 401 Unauthorized from {url} for station '{station_id}'. "
                    f"Invalid or missing {HEADER_KEY_NAME}. Response: {error_body.strip()}"
                )
            elif status_code == 404:
                logger.warning(
                    f"[FORWARDER] HTTP 404 Not Found from {url}. "
                    f"Unknown station_id '{station_id}'. Response: {error_body.strip()}"
                )
            elif 400 <= status_code < 500:
                logger.warning(
                    f"[FORWARDER] HTTP {status_code} Client Error from {url}: {error_body.strip()}"
                )
            else:
                logger.error(
                    f"[FORWARDER] HTTP {status_code} Server Error from {url}: {error_body.strip()}"
                )

            return False, status_code, error_body

        except urllib.error.URLError as exc:
            self.total_failed += 1
            reason_str = str(exc.reason)
            logger.warning(
                f"[FORWARDER] Connection failed to backend at {url}: {reason_str}. "
                f"Station '{station_id}' message cached/skipped locally without crashing."
            )
            return False, None, reason_str

        except TimeoutError as exc:
            self.total_failed += 1
            logger.warning(
                f"[FORWARDER] Request timed out connecting to {url} ({self.timeout}s): {exc}"
            )
            return False, None, f"Timeout after {self.timeout}s"

        except Exception as exc:
            self.total_failed += 1
            logger.warning(
                f"[FORWARDER] Unexpected error forwarding to {url}: {exc}"
            )
            return False, None, str(exc)

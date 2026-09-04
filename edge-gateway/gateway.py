#!/usr/bin/env python3
"""
AURORA — Antarctic Edge Gateway
================================
Person 3 · Simulated IoT / Data Ingestion Pipeline

Subscribes to station telemetry over MQTT (Mosquitto), extracts station IDs,
validates schema and sensor bounds, performs lightweight preprocessing,
and provides a clean forwarding interface for the future FastAPI backend.

Usage:
    python gateway.py                          # defaults: localhost:1883, topic aurora/stations/+/sensors
    python gateway.py --host localhost --port 1883
    python gateway.py --help
"""

from __future__ import annotations

import argparse
import json
import logging
import signal
import sys
import time
from typing import Any, Dict, Optional

try:
    import paho.mqtt.client as mqtt
    PAHO_AVAILABLE = True
except ImportError:
    mqtt = None
    PAHO_AVAILABLE = False

from forwarder import BackendForwarder
from validator import (
    ValidationResult,
    extract_station_id_from_topic,
    validate_and_preprocess,
)

# ---------------------------------------------------------------------------
# Default Configuration
# ---------------------------------------------------------------------------

DEFAULT_MQTT_HOST = "localhost"
DEFAULT_MQTT_PORT = 1883
DEFAULT_MQTT_TOPIC = "aurora/stations/+/sensors"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("aurora.edge_gateway")


# ---------------------------------------------------------------------------
# Edge Gateway
# ---------------------------------------------------------------------------

class EdgeGateway:
    """
    Subscribes to MQTT station telemetry, validates payloads,
    preprocesses values, and manages station dispatch.
    """

    def __init__(
        self,
        host: str = DEFAULT_MQTT_HOST,
        port: int = DEFAULT_MQTT_PORT,
        topic: str = DEFAULT_MQTT_TOPIC,
        forwarder: Optional[BackendForwarder] = None,
    ) -> None:
        self.host = host
        self.port = port
        self.topic = topic
        self.forwarder = forwarder or BackendForwarder()

        self._client: Optional[mqtt.Client] = None
        self._connected = False
        self._running = False

        # Stats
        self.messages_received = 0
        self.messages_valid = 0
        self.messages_rejected = 0

    @property
    def is_connected(self) -> bool:
        return self._connected

    def handle_message(self, topic: str, raw_payload: bytes | str) -> ValidationResult:
        """
        Process a single incoming message:
        1. Decode UTF-8 string
        2. Parse JSON
        3. Validate schema and types
        4. Log results
        5. Forward if valid
        """
        self.messages_received += 1

        # Decode byte payload to text
        if isinstance(raw_payload, bytes):
            try:
                payload_str = raw_payload.decode("utf-8")
            except UnicodeDecodeError as exc:
                self.messages_rejected += 1
                logger.warning(
                    f"[GATEWAY] Received non-UTF8 payload on topic '{topic}': {exc}"
                )
                return ValidationResult(
                    valid=False,
                    errors=[f"Payload is not valid UTF-8: {exc}"],
                )
        else:
            payload_str = str(raw_payload)

        # Parse JSON
        try:
            raw_data = json.loads(payload_str)
        except json.JSONDecodeError as exc:
            self.messages_rejected += 1
            logger.warning("=" * 60)
            logger.warning(f"[GATEWAY] Message Received on topic: '{topic}'")
            logger.warning(f"[GATEWAY] Validation: REJECTED (Malformed JSON: {exc})")
            logger.warning(f"[GATEWAY] Raw Payload: {repr(payload_str)}")
            logger.warning("=" * 60)
            return ValidationResult(
                valid=False,
                errors=[f"Malformed JSON: {exc}"],
            )

        # Validate schema & preprocess
        result = validate_and_preprocess(raw_data, topic=topic)

        # Extract station ID for logging
        station_id = (
            result.station_id
            or extract_station_id_from_topic(topic)
            or (raw_data.get("station_id") if isinstance(raw_data, dict) else "unknown")
        )

        if not result.valid:
            self.messages_rejected += 1
            logger.warning("-" * 60)
            logger.warning(f"[GATEWAY] Message Received on topic: '{topic}'")
            logger.warning(f"[GATEWAY] Station ID : {station_id}")
            logger.warning(f"[GATEWAY] Validation : REJECTED")
            for err in result.errors:
                logger.warning(f"          ↳ Error: {err}")
            logger.warning(f"[GATEWAY] Raw Payload: {repr(payload_str)}")
            logger.warning("-" * 60)
            return result

        # Message is valid
        self.messages_valid += 1
        data = result.data or {}
        logger.info("-" * 60)
        logger.info(f"[GATEWAY] Message Received on topic: '{topic}'")
        logger.info(f"[GATEWAY] Validation : VALID")
        logger.info(f"[GATEWAY] Station ID : {data.get('station_id')}")
        logger.info(f"[GATEWAY] Timestamp  : {data.get('timestamp')}")
        logger.info(
            f"[GATEWAY] Sensors    : "
            f"temp={data.get('temperature')}°C | "
            f"battery={data.get('battery')}% | "
            f"wind={data.get('wind')}km/h | "
            f"pressure={data.get('pressure')}hPa"
        )
        logger.info(f"[GATEWAY] Preprocessed JSON: {json.dumps(data)}")

        # Forward to placeholder interface (Person 1 backend integration point)
        if self.forwarder:
            self.forwarder.forward(data)

        logger.info("-" * 60)
        return result

    def start(self) -> bool:
        """
        Connect to the MQTT broker and begin listening.
        """
        if not PAHO_AVAILABLE:
            logger.error("[GATEWAY] 'paho-mqtt' is not installed. Edge gateway cannot run.")
            return False

        try:
            self._client = mqtt.Client(
                mqtt.CallbackAPIVersion.VERSION2,
                client_id=f"aurora-edge-gateway-{int(time.time())}",
            )

            def _on_connect(client, userdata, flags, reason_code, properties):
                if reason_code == 0:
                    self._connected = True
                    logger.info(f"[MQTT] Connected to Mosquitto broker at {self.host}:{self.port}")
                    # Subscribe to wildcard station topic
                    client.subscribe(self.topic, qos=1)
                    logger.info(f"[MQTT] Subscribed to topic: '{self.topic}'")
                else:
                    self._connected = False
                    logger.error(f"[MQTT] Connection refused by broker (reason_code: {reason_code})")

            def _on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
                self._connected = False
                if reason_code != 0:
                    logger.warning(f"[MQTT] Broker disconnected unexpectedly (reason_code: {reason_code})")

            def _on_message(client, userdata, msg):
                try:
                    self.handle_message(msg.topic, msg.payload)
                except Exception as exc:
                    logger.error(f"[GATEWAY] Unexpected error handling message on '{msg.topic}': {exc}")

            self._client.on_connect = _on_connect
            self._client.on_disconnect = _on_disconnect
            self._client.on_message = _on_message

            logger.info(f"[GATEWAY] Connecting to broker at {self.host}:{self.port}...")
            self._client.connect(self.host, self.port, keepalive=60)
            self._client.loop_start()

            # Wait briefly for on_connect callback to settle
            deadline = time.monotonic() + 1.5
            while not self._connected and time.monotonic() < deadline:
                time.sleep(0.05)

            if not self._connected:
                logger.warning(
                    f"[GATEWAY] Connection to broker at {self.host}:{self.port} could not be confirmed immediately."
                )

            return True

        except (ConnectionRefusedError, OSError, TimeoutError) as exc:
            self._connected = False
            logger.error(f"[GATEWAY] Could not connect to Mosquitto broker at {self.host}:{self.port}")
            logger.error(f"[GATEWAY] Detail: {exc}")
            logger.error("[GATEWAY] Ensure Mosquitto is running (e.g., 'mosquitto -v').")
            return False
        except Exception as exc:
            self._connected = False
            logger.error(f"[GATEWAY] Unexpected error connecting to broker: {exc}")
            return False

    def stop(self) -> None:
        """Cleanly disconnect and stop the MQTT network loop."""
        logger.info("[GATEWAY] Shutting down edge gateway...")
        if self._client:
            try:
                if self._connected:
                    self._client.unsubscribe(self.topic)
                    self._client.disconnect()
                self._client.loop_stop()
                logger.info("[GATEWAY] Disconnected from MQTT broker cleanly.")
            except Exception as exc:
                logger.error(f"[GATEWAY] Error during shutdown: {exc}")
            finally:
                self._connected = False

        logger.info(
            f"[GATEWAY] Summary: {self.messages_received} received, "
            f"{self.messages_valid} valid, {self.messages_rejected} rejected."
        )


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

_running = True


def _handle_signal(signum, frame):
    """Graceful shutdown handler for SIGINT and SIGTERM."""
    global _running
    _running = False


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)

    parser = argparse.ArgumentParser(
        description="AURORA — Antarctic Station Edge Gateway",
    )
    parser.add_argument(
        "--host",
        type=str,
        default=DEFAULT_MQTT_HOST,
        help=f"MQTT broker hostname (default: {DEFAULT_MQTT_HOST})",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=DEFAULT_MQTT_PORT,
        help=f"MQTT broker port (default: {DEFAULT_MQTT_PORT})",
    )
    parser.add_argument(
        "--topic",
        type=str,
        default=DEFAULT_MQTT_TOPIC,
        help=f"MQTT topic to subscribe to (default: {DEFAULT_MQTT_TOPIC})",
    )
    parser.add_argument(
        "--backend-url",
        type=str,
        default="http://localhost:8000/ingest",
        help="Person 1 backend ingestion endpoint (default: http://localhost:8000/ingest)",
    )
    parser.add_argument(
        "--gateway-key",
        type=str,
        default="aurora-dev-key",
        help="X-Gateway-Key authentication header value (default: aurora-dev-key)",
    )
    parser.add_argument(
        "--no-backend",
        action="store_true",
        help="Disable HTTP forwarding to backend",
    )
    args = parser.parse_args()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    print("=" * 60)
    print("  AURORA Edge Gateway")
    print(f"  Broker   : {args.host}:{args.port}")
    print(f"  Topic    : {args.topic}")
    print(f"  Backend  : {'Disabled' if args.no_backend else args.backend_url}")
    print("  Status   : Initializing...")
    print("  Press Ctrl+C to stop cleanly")
    print("=" * 60)

    forwarder = BackendForwarder(
        endpoint_url=args.backend_url,
        gateway_key=args.gateway_key,
        enabled=not args.no_backend,
    )

    gateway = EdgeGateway(
        host=args.host,
        port=args.port,
        topic=args.topic,
        forwarder=forwarder,
    )

    success = gateway.start()
    if not success:
        print("[GATEWAY] Failed to initialize MQTT connection. Exiting.")
        sys.exit(1)

    try:
        while _running:
            time.sleep(0.25)
    finally:
        gateway.stop()

    print("[GATEWAY] Stopped.")


if __name__ == "__main__":
    main()

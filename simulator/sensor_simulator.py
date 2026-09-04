#!/usr/bin/env python3
"""
AURORA — Antarctic Station Sensor Simulator
============================================
Person 3 · Simulated IoT / Data Ingestion Pipeline

Generates realistic, gradually-fluctuating telemetry for an Antarctic
research station and publishes structured JSON messages to a local
Mosquitto MQTT broker.

Usage:
    python sensor_simulator.py                 # defaults: maitri, 3s interval, localhost:1883
    python sensor_simulator.py --station bharati --interval 5
    python sensor_simulator.py --no-mqtt       # console-only mode
    python sensor_simulator.py --help
"""

from __future__ import annotations

import argparse
import json
import math
import random
import signal
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

try:
    import paho.mqtt.client as mqtt
    PAHO_AVAILABLE = True
except ImportError:
    mqtt = None
    PAHO_AVAILABLE = False


# ---------------------------------------------------------------------------
# MQTT constants and topic conventions
# ---------------------------------------------------------------------------

DEFAULT_MQTT_HOST = "localhost"
DEFAULT_MQTT_PORT = 1883
TOPIC_TEMPLATE = "aurora/stations/{station_id}/sensors"


def get_station_topic(station_id: str) -> str:
    """Generate canonical MQTT topic for a station's sensor telemetry."""
    return TOPIC_TEMPLATE.format(station_id=station_id)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class TelemetryReading:
    """Single point-in-time reading from all sensors at a station."""

    station_id: str
    timestamp: str  # ISO-8601 UTC
    temperature: float
    battery: float
    wind: float
    pressure: float

    # Aliases for backward compatibility
    @property
    def temperature_c(self) -> float:
        return self.temperature

    @property
    def wind_speed_kmh(self) -> float:
        return self.wind

    @property
    def pressure_hpa(self) -> float:
        return self.pressure

    @property
    def battery_pct(self) -> float:
        return self.battery

    def to_dict(self) -> dict:
        """Structured dictionary for MQTT payload."""
        return {
            "station_id": self.station_id,
            "timestamp": self.timestamp,
            "temperature": self.temperature,
            "battery": self.battery,
            "wind": self.wind,
            "pressure": self.pressure,
        }

    def to_json(self) -> str:
        """Serialize to a compact JSON string for MQTT transmission."""
        return json.dumps(self.to_dict(), separators=(",", ":"))

    def to_json_pretty(self) -> str:
        """Serialize to a human-readable JSON string for console display."""
        return json.dumps(self.to_dict(), indent=2)


# ---------------------------------------------------------------------------
# Individual sensor models
# ---------------------------------------------------------------------------

class _DriftingSensor:
    """
    Base random-walk sensor model.

    Each tick the value drifts toward a slowly-moving attractor and receives
    a small noise perturbation. This produces smooth, believable curves
    rather than jagged random jumps.
    """

    def __init__(
        self,
        initial: float,
        low: float,
        high: float,
        drift_rate: float = 0.15,
        noise_scale: float = 0.3,
        mean_revert_strength: float = 0.02,
        baseline: Optional[float] = None,
    ) -> None:
        self.value = initial
        self.low = low
        self.high = high
        self.drift_rate = drift_rate
        self.noise_scale = noise_scale
        self.mean_revert_strength = mean_revert_strength
        self.baseline = baseline if baseline is not None else initial

    def step(self) -> float:
        """Advance the sensor by one tick and return the new value."""
        revert = (self.baseline - self.value) * self.mean_revert_strength
        drift = random.gauss(0, self.drift_rate)
        noise = random.gauss(0, self.noise_scale)

        self.value += revert + drift + noise
        self.value = max(self.low, min(self.high, self.value))
        return round(self.value, 2)


class TemperatureSensor(_DriftingSensor):
    """Antarctic temperature model (°C)."""

    def __init__(self, baseline: float = -34.5) -> None:
        super().__init__(
            initial=baseline,
            low=-50.0,
            high=-5.0,
            drift_rate=0.20,
            noise_scale=0.35,
            mean_revert_strength=0.015,
            baseline=baseline,
        )


class WindSensor(_DriftingSensor):
    """Antarctic wind speed model (km/h) with occasional gust spikes."""

    def __init__(self, baseline: float = 42.0) -> None:
        super().__init__(
            initial=baseline,
            low=0.0,
            high=120.0,
            drift_rate=0.8,
            noise_scale=1.2,
            mean_revert_strength=0.025,
            baseline=baseline,
        )

    def step(self) -> float:
        # ~5% chance of a gust event that temporarily adds 8-25 km/h
        if random.random() < 0.05:
            gust = random.uniform(8, 25)
            self.value += gust
        return super().step()


class PressureSensor(_DriftingSensor):
    """Barometric pressure model (hPa)."""

    def __init__(self, baseline: float = 968.0) -> None:
        super().__init__(
            initial=baseline,
            low=940.0,
            high=1030.0,
            drift_rate=0.15,
            noise_scale=0.20,
            mean_revert_strength=0.010,
            baseline=baseline,
        )


class BatterySensor(_DriftingSensor):
    """
    Battery percentage model (%).

    Uses a simple sinusoidal "day/night" factor: during the Antarctic
    winter there is little solar gain, so the battery drains slowly;
    during brighter periods it recovers. The cycle is compressed to
    ~10 minutes for demo visibility.
    """

    CYCLE_PERIOD_S = 600  # seconds for one full charge/drain cycle

    def __init__(self, baseline: float = 61.0) -> None:
        super().__init__(
            initial=baseline,
            low=0.0,
            high=100.0,
            drift_rate=0.10,
            noise_scale=0.15,
            mean_revert_strength=0.020,
            baseline=baseline,
        )
        self._start_time = time.monotonic()

    def step(self) -> float:
        elapsed = time.monotonic() - self._start_time
        solar_factor = 0.3 * math.sin(2 * math.pi * elapsed / self.CYCLE_PERIOD_S)
        self.value += solar_factor
        return super().step()


# ---------------------------------------------------------------------------
# Demo Event Sensor Models (Person 3 Demo Modes)
# ---------------------------------------------------------------------------

class StormWindSensor(WindSensor):
    """
    Storm wind model: sustained gale-force winds (95-125 km/h)
    with frequent severe gusts (up to 150 km/h).
    Safe within validator range [0.0, 300.0] km/h.
    """

    def __init__(self, baseline: float = 102.0) -> None:
        super().__init__(baseline=baseline)
        self.value = baseline
        self.low = 70.0
        self.high = 160.0
        self.drift_rate = 1.4
        self.noise_scale = 2.2
        self.mean_revert_strength = 0.03
        self.baseline = baseline

    def step(self) -> float:
        # 30% chance of severe katabatic gust spike (+12-25 km/h)
        if random.random() < 0.30:
            self.value += random.uniform(12, 25)
        return super().step()


class StormPressureSensor(PressureSensor):
    """
    Storm barometric pressure model: deep cyclonic depression (940-952 hPa).
    Safe within validator range [800.0, 1150.0] hPa.
    """

    def __init__(self, baseline: float = 946.0) -> None:
        super().__init__(baseline=baseline)
        self.value = baseline
        self.low = 920.0
        self.high = 960.0
        self.drift_rate = 0.25
        self.noise_scale = 0.30
        self.mean_revert_strength = 0.02
        self.baseline = baseline


class StormTemperatureSensor(TemperatureSensor):
    """
    Storm temperature model: severe blizzard cold and thermal drop.
    Safe within validator range [-100.0, 50.0] °C.
    """

    def __init__(self, baseline: float = -42.0) -> None:
        super().__init__(baseline=baseline)
        self.value = baseline
        self.low = -60.0
        self.high = -20.0
        self.drift_rate = 0.30
        self.noise_scale = 0.40
        self.mean_revert_strength = 0.02
        self.baseline = baseline


class RapidDrainBatterySensor(_DriftingSensor):
    """
    Rapid battery drain simulation event.

    Simulates emergency generator failure or high heating load,
    dropping ~2.5% to 4.0% per tick down to reserve levels.
    Safe within validator range [0.0, 100.0] %.
    """

    def __init__(self, initial: float = 72.0, drain_rate: float = 3.2) -> None:
        super().__init__(
            initial=initial,
            low=5.0,
            high=100.0,
            drift_rate=0.1,
            noise_scale=0.1,
            mean_revert_strength=0.0,
            baseline=5.0,
        )
        self.drain_rate = drain_rate

    def step(self) -> float:
        # Rapid progressive discharge each tick
        drain = self.drain_rate + random.uniform(-0.3, 0.4)
        self.value = max(self.low, self.value - drain)
        return round(self.value, 2)


# ---------------------------------------------------------------------------
# Station configuration
# ---------------------------------------------------------------------------

STATION_PROFILES: dict[str, dict[str, float]] = {
    "maitri": {
        "temperature": -34.5,
        "wind": 42.0,
        "pressure": 968.0,
        "battery": 61.0,
    },
    "bharati": {
        "temperature": -28.2,
        "wind": 56.0,
        "pressure": 982.0,
        "battery": 44.0,
    },
}


# ---------------------------------------------------------------------------
# Modular MQTT Publishing Layer
# ---------------------------------------------------------------------------

class MQTTPublisher:
    """
    Modular MQTT publisher layer for station telemetry.

    Connects to a Mosquitto MQTT broker using paho-mqtt (API v2),
    maintains a background network loop, and provides graceful error
    handling so that broker outages do not crash the simulation.
    """

    def __init__(
        self,
        host: str = DEFAULT_MQTT_HOST,
        port: int = DEFAULT_MQTT_PORT,
        keepalive: int = 60,
        client_id: Optional[str] = None,
    ) -> None:
        self.host = host
        self.port = port
        self.keepalive = keepalive
        self.client_id = client_id or f"aurora-sim-{random.randint(1000, 9999)}"
        self._connected = False
        self._client: Optional[mqtt.Client] = None

    @property
    def is_connected(self) -> bool:
        return self._connected

    def connect(self) -> bool:
        """
        Attempt connection to MQTT broker.
        Returns True on successful connection dispatch, False on failure.
        """
        if not PAHO_AVAILABLE:
            print("[MQTT] ERROR: 'paho-mqtt' library is not installed. MQTT publishing disabled.")
            return False

        try:
            self._client = mqtt.Client(
                mqtt.CallbackAPIVersion.VERSION2,
                client_id=self.client_id,
            )

            def _on_connect(client, userdata, flags, reason_code, properties):
                if reason_code == 0:
                    self._connected = True
                    print(f"[MQTT] Connected to Mosquitto broker at {self.host}:{self.port}")
                else:
                    self._connected = False
                    print(f"[MQTT] Connection refused by broker (reason_code: {reason_code})")

            def _on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
                self._connected = False
                if reason_code != 0:
                    print(f"[MQTT] Warning: Broker disconnected unexpectedly (code: {reason_code})")

            self._client.on_connect = _on_connect
            self._client.on_disconnect = _on_disconnect

            self._client.connect(self.host, self.port, keepalive=self.keepalive)
            self._client.loop_start()

            # Wait briefly for on_connect callback to settle
            settle_deadline = time.monotonic() + 1.0
            while not self._connected and time.monotonic() < settle_deadline:
                time.sleep(0.05)

            return self._connected

        except (ConnectionRefusedError, OSError, TimeoutError) as exc:
            self._connected = False
            print(f"[MQTT] WARNING: Could not connect to Mosquitto broker at {self.host}:{self.port}")
            print(f"[MQTT] Detail: {exc}")
            print("[MQTT] Please ensure Mosquitto is running (e.g., 'mosquitto -v').")
            return False
        except Exception as exc:
            self._connected = False
            print(f"[MQTT] WARNING: Unexpected connection failure: {exc}")
            return False

    def publish(self, topic: str, payload: str, qos: int = 1) -> bool:
        """Publish payload to the given topic."""
        if not self._client or not self._connected:
            return False

        try:
            msg_info = self._client.publish(topic, payload, qos=qos)
            return msg_info.rc == mqtt.MQTT_ERR_SUCCESS
        except Exception as exc:
            print(f"[MQTT] Failed to publish message: {exc}")
            return False

    def disconnect(self) -> None:
        """Cleanly disconnect from the MQTT broker and stop network loop."""
        if self._client:
            try:
                if self._connected:
                    self._client.disconnect()
                self._client.loop_stop()
                print("[MQTT] Cleanly disconnected from MQTT broker.")
            except Exception as exc:
                print(f"[MQTT] Error during disconnect: {exc}")
            finally:
                self._connected = False


# ---------------------------------------------------------------------------
# Station Simulator
# ---------------------------------------------------------------------------

class StationSimulator:
    """
    Generates telemetry for one Antarctic research station.

    Call `tick()` to produce one `TelemetryReading`.
    Call `publish(reading)` to output locally and publish to MQTT.
    """

    def __init__(
        self,
        station_id: str,
        mqtt_publisher: Optional[MQTTPublisher] = None,
        mqtt_topic: Optional[str] = None,
        event: str = "none",
    ) -> None:
        self.station_id = station_id
        self.event = (event or "none").lower().strip()
        profile = STATION_PROFILES.get(station_id, STATION_PROFILES["maitri"])

        if self.event == "storm":
            # Storm event: sustained gale winds (95-125+ km/h), deep barometric drop, and thermal chill
            self.temperature = StormTemperatureSensor(baseline=profile["temperature"] - 6.0)
            self.wind = StormWindSensor(baseline=profile["wind"] + 58.0)
            self.pressure = StormPressureSensor(baseline=profile["pressure"] - 22.0)
            self.battery = BatterySensor(baseline=profile["battery"])
        elif self.event in ("battery-drain", "batterydrain", "drain"):
            # Rapid battery drain: steady accelerated discharge tick-by-tick
            self.temperature = TemperatureSensor(baseline=profile["temperature"])
            self.wind = WindSensor(baseline=profile["wind"])
            self.pressure = PressureSensor(baseline=profile["pressure"])
            self.battery = RapidDrainBatterySensor(initial=profile["battery"])
        else:
            self.temperature = TemperatureSensor(baseline=profile["temperature"])
            self.wind = WindSensor(baseline=profile["wind"])
            self.pressure = PressureSensor(baseline=profile["pressure"])
            self.battery = BatterySensor(baseline=profile["battery"])

        self._reading_count = 0
        self.mqtt_publisher = mqtt_publisher
        self.mqtt_topic = mqtt_topic or get_station_topic(self.station_id)

    def tick(self) -> TelemetryReading:
        """Advance all sensors by one step and return a reading."""
        self._reading_count += 1
        return TelemetryReading(
            station_id=self.station_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            temperature=self.temperature.step(),
            battery=self.battery.step(),
            wind=self.wind.step(),
            pressure=self.pressure.step(),
        )

    def publish(self, reading: TelemetryReading) -> None:
        """
        Emit a telemetry reading.

        1. Prints active event banner if enabled.
        2. Prints structured JSON to stdout.
        3. Publishes JSON to the configured MQTT topic if broker is connected.
        """
        if self.event == "storm":
            print(f"[DEMO EVENT: STORM SPIKE] Wind: {reading.wind} km/h | Pressure: {reading.pressure} hPa | Temp: {reading.temperature} °C")
        elif self.event in ("battery-drain", "batterydrain", "drain"):
            print(f"[DEMO EVENT: RAPID BATTERY DRAIN] Battery Level: {reading.battery}% (rapid discharge active)")

        print(reading.to_json_pretty())

        if self.mqtt_publisher and self.mqtt_publisher.is_connected:
            success = self.mqtt_publisher.publish(self.mqtt_topic, reading.to_json())
            status = "published" if success else "send_queued"
            print(f"[MQTT -> {self.mqtt_topic}] ({status})")
        elif self.mqtt_publisher:
            print(f"[MQTT -> {self.mqtt_topic}] (broker offline - skipped publish)")

    @property
    def reading_count(self) -> int:
        return self._reading_count


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

_running = True


def _handle_signal(signum, frame):
    """Graceful shutdown on Ctrl-C or SIGTERM."""
    global _running
    _running = False


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)

    parser = argparse.ArgumentParser(
        description="AURORA — Antarctic Station Sensor Simulator",
    )
    parser.add_argument(
        "--station",
        type=str,
        default="maitri",
        choices=list(STATION_PROFILES.keys()),
        help="Station identifier (default: maitri)",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=3.0,
        help="Seconds between readings (default: 3.0)",
    )
    parser.add_argument(
        "--event",
        type=str,
        default="none",
        choices=["none", "storm", "battery-drain"],
        help="Trigger demo event: 'storm' (gale wind spike & pressure drop) or 'battery-drain' (rapid battery discharge)",
    )
    parser.add_argument(
        "--mqtt-host",
        type=str,
        default=DEFAULT_MQTT_HOST,
        help=f"MQTT broker hostname (default: {DEFAULT_MQTT_HOST})",
    )
    parser.add_argument(
        "--mqtt-port",
        type=int,
        default=DEFAULT_MQTT_PORT,
        help=f"MQTT broker port (default: {DEFAULT_MQTT_PORT})",
    )
    parser.add_argument(
        "--mqtt-topic",
        type=str,
        default=None,
        help="Custom MQTT topic (default: aurora/stations/<station>/sensors)",
    )
    parser.add_argument(
        "--no-mqtt",
        action="store_true",
        help="Disable MQTT publishing and run in console-only mode",
    )
    args = parser.parse_args()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    # Initialize MQTT publisher layer if enabled
    mqtt_pub: Optional[MQTTPublisher] = None
    if not args.no_mqtt:
        mqtt_pub = MQTTPublisher(host=args.mqtt_host, port=args.mqtt_port)
        connected = mqtt_pub.connect()
        if not connected:
            print("[Simulator] Continuing in local-only mode without MQTT.\n")

    sim = StationSimulator(
        station_id=args.station,
        mqtt_publisher=mqtt_pub,
        mqtt_topic=args.mqtt_topic,
        event=args.event,
    )

    event_label = "NOMINAL (None)"
    if args.event == "storm":
        event_label = "STORM SPIKE [ACTIVE]"
    elif args.event in ("battery-drain", "batterydrain", "drain"):
        event_label = "RAPID BATTERY DRAIN [ACTIVE]"

    print(f"{'=' * 60}")
    print(f"  AURORA Sensor Simulator")
    print(f"  Station   : {args.station}")
    print(f"  Interval  : {args.interval}s")
    print(f"  Event Mode: {event_label}")
    print(f"  MQTT Topic: {sim.mqtt_topic}")
    print(f"  MQTT State: {'Connected' if (mqtt_pub and mqtt_pub.is_connected) else 'Disabled / Offline'}")
    print(f"  Press Ctrl+C to stop")
    print(f"{'=' * 60}")
    print()

    try:
        while _running:
            reading = sim.tick()
            sim.publish(reading)
            print()

            deadline = time.monotonic() + args.interval
            while _running and time.monotonic() < deadline:
                time.sleep(min(0.25, deadline - time.monotonic()))
    finally:
        if mqtt_pub:
            mqtt_pub.disconnect()

    print(f"\n{'=' * 60}")
    print(f"  Simulator stopped cleanly.")
    print(f"  Total readings generated: {sim.reading_count}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

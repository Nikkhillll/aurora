# AURORA — Sensor Simulator

**Person 3 · Simulated IoT / Data Ingestion Pipeline**

Generates realistic, gradually-fluctuating telemetry for an Antarctic research station.  
Pure Python — no external dependencies required.

---

## Quick Start

```bash
cd simulator
python sensor_simulator.py
```

Stop with **Ctrl+C** — the simulator shuts down cleanly and reports total readings.

---

## CLI Options

| Flag | Default | Description |
|---|---|---|
| `--station` | `maitri` | Station ID (`maitri` or `bharati`) |
| `--interval` | `3.0` | Seconds between readings |
| `--event` | `none` | Demo anomaly mode: `none`, `storm`, or `battery-drain` |
| `--mqtt-host` | `localhost` | MQTT broker host |
| `--mqtt-port` | `1883` | MQTT broker port |
| `--no-mqtt` | `false` | Run in console-only mode |

```bash
# Nominal simulation (Bharati station, 5-second intervals)
python sensor_simulator.py --station bharati --interval 5

# Demo Event 1: Storm spike (gale winds 100+ km/h, barometric drop)
python sensor_simulator.py --station maitri --event storm

# Demo Event 2: Rapid battery drain (severe generator / solar discharge)
python sensor_simulator.py --station bharati --event battery-drain
```

---

## Telemetry Format

Each reading is a JSON object printed to stdout:

```json
{
  "station_id": "maitri",
  "timestamp": "2026-09-03T20:30:00.123456+00:00",
  "temperature_c": -34.12,
  "wind_speed_kmh": 43.7,
  "pressure_hpa": 967.85,
  "battery_pct": 60.44
}
```

| Field | Unit | Typical Range (Maitri) |
|---|---|---|
| `temperature_c` | °C | −50 to −5 (baseline ≈ −34.5) |
| `wind_speed_kmh` | km/h | 0 – 120 (baseline ≈ 42) |
| `pressure_hpa` | hPa | 940 – 1030 (baseline ≈ 968) |
| `battery_pct` | % | 0 – 100 (baseline ≈ 61) |

---

## Sensor Model

Values change gradually using a **random-walk with mean reversion**:

1. A gentle pull toward the station's baseline prevents runaway drift.
2. Gaussian drift + noise produces smooth, realistic curves.
3. Wind has a ~5% per-tick chance of a gust spike (+8–25 km/h).
4. Battery follows a compressed sinusoidal day/night charge cycle (~10 min period for demo visibility).

---

## Architecture

```
sensor_simulator.py
├── TelemetryReading       (dataclass — serialises to JSON)
├── _DriftingSensor         (base random-walk model)
│   ├── TemperatureSensor
│   ├── WindSensor          (adds gust events)
│   ├── PressureSensor
│   └── BatterySensor       (adds solar charge/drain cycle)
├── StationSimulator        (orchestrator — tick() + publish())
└── main()                  (CLI + graceful shutdown)
```

**MQTT integration point:** `StationSimulator.publish()` currently prints to stdout.  
When MQTT is added, this method will be extended to call `mqtt_client.publish(topic, payload)`.

---

## Next Steps

- [ ] Add MQTT publishing (Mosquitto broker + `paho-mqtt`)
- [ ] Build edge-gateway to subscribe and forward to backend
- [ ] Add more sensor types (humidity, UV, seismic)

# AURORA — Edge Gateway

**Person 3 · Simulated IoT / Data Ingestion Pipeline**

The Edge Gateway serves as the local telemetry ingestion and validation node for the AURORA Antarctic Digital Twin platform.

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌───────────────────────────┐
│   sensor_simulator.py  │ ───> │     Mosquitto Broker    │ ───> │        Edge Gateway       │
│  (Maitri / Bharati)    │ MQTT │      (Port: 1883)       │ MQTT │  • Validation             │
└────────────────────────┘      └─────────────────────────┘      │  • Preprocessing          │
                                                                 │  • Future Backend Forward │
                                                                 └───────────────────────────┘
```

---

## Quick Start

1. **Activate Virtual Environment:**
   ```bash
   cd edge-gateway
   .\.venv\Scripts\activate
   ```

2. **Run the Edge Gateway:**
   ```bash
   python gateway.py
   ```

3. **CLI Options:**
   | Flag | Default | Description |
   |---|---|---|
   | `--host` | `localhost` | MQTT broker host |
   | `--port` | `1883` | MQTT broker port |
   | `--topic` | `aurora/stations/+/sensors` | Wildcard subscription topic |

---

## Architecture

- **`gateway.py`**: Main MQTT subscriber using `paho-mqtt` (API v2). Connects to Mosquitto, receives messages across all station topics, dispatches to validator, and logs structured telemetry.
- **`validator.py`**: Telemetry schema validation, station ID extraction, type checking, sensor physical bounds verification, and lightweight preprocessing.
- **`forwarder.py`**: Encapsulates HTTP POST forwarding to Person 1's FastAPI backend (`http://localhost:8000/ingest`), schema transformation, `X-Gateway-Key` authentication header, and non-blocking failure handling.
- **`requirements.txt`**: Pinned Python dependencies (`paho-mqtt==2.1.0`).
- **`test_forwarder.py`**: Unit tests for backend contract schema transformation and offline error handling.
- **`test_gateway.py`**: Unit and integration test suite.

"""
AURORA Edge Gateway Test Suite
==============================
Tests schema validation, error handling, and end-to-end MQTT message flow.
"""

import json
import time
import paho.mqtt.client as mqtt
from gateway import EdgeGateway
from validator import validate_and_preprocess


def test_unit_validation():
    print("========================================")
    print("UNIT TEST 1: Payload Validation & Preprocessing")
    print("========================================")

    # 1. Valid payload
    valid_payload = {
        "station_id": "maitri",
        "timestamp": "2026-09-04T02:30:00.123456+00:00",
        "temperature": -34.567,
        "battery": 61.234,
        "wind": 42.109,
        "pressure": 968.456,
    }
    res_valid = validate_and_preprocess(valid_payload, "aurora/stations/maitri/sensors")
    print("Valid test result:", res_valid.summary())
    assert res_valid.valid is True
    assert res_valid.data["temperature"] == -34.57  # rounded to 2 decimals
    assert res_valid.data["station_id"] == "maitri"

    # 2. Missing required field
    missing_payload = {
        "station_id": "maitri",
        "timestamp": "2026-09-04T02:30:00+00:00",
        "temperature": -34.5,
        "battery": 61.2,
        "wind": 42.1,
        # missing pressure
    }
    res_missing = validate_and_preprocess(missing_payload, "aurora/stations/maitri/sensors")
    print("Missing field result:", res_missing.summary())
    assert res_missing.valid is False
    assert any("pressure" in e for e in res_missing.errors)

    # 3. Malformed values (non-numeric, out-of-range)
    bad_values = {
        "station_id": "maitri",
        "timestamp": "2026-09-04T02:30:00+00:00",
        "temperature": "FREEZING",
        "battery": 150.0,
        "wind": -5.0,
        "pressure": 968.0,
    }
    res_bad = validate_and_preprocess(bad_values, "aurora/stations/maitri/sensors")
    print("Bad values result:", res_bad.summary())
    assert res_bad.valid is False
    assert len(res_bad.errors) == 3

    print("\n[PASS] All unit validation tests passed!\n")


def test_gateway_handler():
    print("========================================")
    print("UNIT TEST 2: Gateway Message Handling")
    print("========================================")

    gw = EdgeGateway()

    # Valid message
    valid_json = json.dumps({
        "station_id": "bharati",
        "timestamp": "2026-09-04T02:30:00+00:00",
        "temperature": -28.2,
        "battery": 44.0,
        "wind": 56.0,
        "pressure": 982.0,
    })
    r1 = gw.handle_message("aurora/stations/bharati/sensors", valid_json)
    assert r1.valid is True

    # Malformed JSON
    r2 = gw.handle_message("aurora/stations/maitri/sensors", '{"station_id": "maitri", BAD_JSON}')
    assert r2.valid is False

    # Missing field
    missing_json = json.dumps({
        "station_id": "maitri",
        "timestamp": "2026-09-04T02:30:00+00:00",
        "temperature": -34.5,
        "battery": 61.0,
        "wind": 42.0,
    })
    r3 = gw.handle_message("aurora/stations/maitri/sensors", missing_json)
    assert r3.valid is False

    assert gw.messages_received == 3
    assert gw.messages_valid == 1
    assert gw.messages_rejected == 2

    print("\n[PASS] Gateway handler tests passed! (1 valid, 2 rejected cleanly)\n")


def test_live_mqtt_flow():
    print("========================================")
    print("INTEGRATION TEST: Live Mosquitto -> Edge Gateway")
    print("========================================")

    from forwarder import BackendForwarder
    gw = EdgeGateway(
        host="localhost",
        port=1883,
        topic="aurora/stations/+/sensors",
        forwarder=BackendForwarder(enabled=False),
    )
    started = gw.start()
    assert started, "Gateway failed to start and connect to Mosquitto"

    # Use an ephemeral client to publish test messages
    pub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="test-publisher")
    pub.connect("localhost", 1883, keepalive=60)
    pub.loop_start()

    time.sleep(0.5)

    # 1. Publish valid message for maitri
    valid_maitri = json.dumps({
        "station_id": "maitri",
        "timestamp": "2026-09-04T02:35:00+00:00",
        "temperature": -34.2,
        "battery": 61.1,
        "wind": 42.5,
        "pressure": 968.2,
    })
    pub.publish("aurora/stations/maitri/sensors", valid_maitri, qos=1)

    # 2. Publish malformed JSON
    pub.publish("aurora/stations/maitri/sensors", "{not-valid-json", qos=1)

    # 3. Publish message missing 'temperature'
    missing_temp = json.dumps({
        "station_id": "maitri",
        "timestamp": "2026-09-04T02:35:02+00:00",
        "battery": 61.1,
        "wind": 42.5,
        "pressure": 968.2,
    })
    pub.publish("aurora/stations/maitri/sensors", missing_temp, qos=1)

    # 4. Publish valid message for bharati
    valid_bharati = json.dumps({
        "station_id": "bharati",
        "timestamp": "2026-09-04T02:35:03+00:00",
        "temperature": -28.1,
        "battery": 44.2,
        "wind": 55.8,
        "pressure": 981.9,
    })
    pub.publish("aurora/stations/bharati/sensors", valid_bharati, qos=1)

    # Wait for messages to be processed
    time.sleep(1.5)

    pub.loop_stop()
    pub.disconnect()
    gw.stop()

    print(f"Processed: {gw.messages_received} total, {gw.messages_valid} valid, {gw.messages_rejected} rejected.")
    assert gw.messages_received >= 4, f"Expected >= 4 messages, got {gw.messages_received}"
    assert gw.messages_valid >= 2, f"Expected >= 2 valid messages, got {gw.messages_valid}"
    assert gw.messages_rejected >= 2, f"Expected >= 2 rejected messages, got {gw.messages_rejected}"

    print("\n[PASS] Live Mosquitto -> Edge Gateway integration test passed successfully!\n")


if __name__ == "__main__":
    test_unit_validation()
    test_gateway_handler()
    test_live_mqtt_flow()

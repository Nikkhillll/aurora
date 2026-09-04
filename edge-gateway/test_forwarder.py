"""
AURORA Edge Gateway — Forwarder Unit Tests
==========================================
Tests payload transformation and offline backend failure handling.
"""

import unittest
from forwarder import (
    DEFAULT_BACKEND_URL,
    DEFAULT_GATEWAY_KEY,
    BackendForwarder,
    transform_telemetry_for_backend,
)


class TestForwarder(unittest.TestCase):
    def test_transform_telemetry_for_backend(self):
        """Test transformation from MQTT schema to Person 1 backend contract."""
        input_data = {
            "station_id": "maitri",
            "timestamp": "2026-09-04T10:22:31+00:00",
            "temperature": -31.2,
            "battery": 64.0,
            "wind": 18.2,
            "pressure": 981.3,
        }

        transformed = transform_telemetry_for_backend(input_data)

        # Exact structure check
        expected = {
            "station_id": "maitri",
            "timestamp": "2026-09-04T10:22:31Z",
            "readings": {
                "temperature": -31.2,
                "battery_level": 64.0,
                "wind_speed": 18.2,
                "pressure": 981.3,
            },
        }

        self.assertEqual(transformed, expected)
        self.assertEqual(transformed["station_id"], "maitri")
        self.assertEqual(transformed["timestamp"], "2026-09-04T10:22:31Z")
        self.assertEqual(transformed["readings"]["temperature"], -31.2)
        self.assertEqual(transformed["readings"]["battery_level"], 64.0)
        self.assertEqual(transformed["readings"]["wind_speed"], 18.2)
        self.assertEqual(transformed["readings"]["pressure"], 981.3)

    def test_transform_telemetry_bharati(self):
        """Test transformation for Bharati station."""
        input_data = {
            "station_id": "bharati",
            "timestamp": "2026-09-04T12:00:00Z",
            "temperature": -28.5,
            "battery": 45.0,
            "wind": 55.0,
            "pressure": 982.0,
        }

        transformed = transform_telemetry_for_backend(input_data)
        self.assertEqual(transformed["station_id"], "bharati")
        self.assertEqual(transformed["readings"]["battery_level"], 45.0)

    def test_offline_backend_handling(self):
        """Test that forwarder handles an unavailable backend without raising exceptions."""
        forwarder = BackendForwarder(
            endpoint_url="http://localhost:8000/ingest",
            timeout=1.0,
        )

        test_data = {
            "station_id": "maitri",
            "timestamp": "2026-09-04T10:22:31Z",
            "temperature": -31.2,
            "battery": 64.0,
            "wind": 18.2,
            "pressure": 981.3,
        }

        # Must not raise an exception
        success, status, msg = forwarder.forward(test_data)
        self.assertFalse(success)
        self.assertIsNone(status)
        self.assertIsNotNone(msg)
        print("\n[PASS] Offline backend safely caught without crash:", msg)


if __name__ == "__main__":
    unittest.main()

"""
AURORA ML validation and sanity checks.

These tests verify that the prediction system behaves
logically under different environmental and energy conditions.
"""

from __future__ import annotations

from .predict import (
    predict_battery_hours,
    predict_cascading_risk,
    predict_storm_risk,
)


def test_storm_scenarios():
    """Test storm predictions under different conditions."""

    scenarios = {
        "normal": {
            "temperature_c": -15,
            "wind_speed_ms": 5,
            "pressure_hpa": 1010,
            "visibility_km": 20,
        },

        "moderate": {
            "temperature_c": -25,
            "wind_speed_ms": 15,
            "pressure_hpa": 990,
            "visibility_km": 7,
        },

        "severe": {
            "temperature_c": -35,
            "wind_speed_ms": 30,
            "pressure_hpa": 950,
            "visibility_km": 1,
        },
    }

    print("\n==============================")
    print("STORM SANITY CHECK")
    print("==============================")

    results = {}

    for name, conditions in scenarios.items():

        risk = predict_storm_risk(
            conditions
        )

        results[name] = risk

        print(
            f"\n{name.upper()}: "
            f"{risk.upper()}"
        )

    return results


def test_battery_scenarios():
    """Test battery behaviour under different conditions."""

    base_environment = {
        "temperature_c": -20,
        "wind_speed_ms": 8,
        "pressure_hpa": 1005,
        "visibility_km": 15,
    }

    # -----------------------------------------------------
    # Scenario 1: Healthy battery
    # -----------------------------------------------------

    healthy_state = {
        "environment": base_environment,
        "energy": {
            "battery_level_pct": 90,
            "generation_kw": 15,
            "consumption_kw": 10,
        },
    }

    # -----------------------------------------------------
    # Scenario 2: Low battery
    # -----------------------------------------------------

    low_battery_state = {
        "environment": base_environment,
        "energy": {
            "battery_level_pct": 20,
            "generation_kw": 15,
            "consumption_kw": 10,
        },
    }

    # -----------------------------------------------------
    # Scenario 3: High consumption
    # -----------------------------------------------------

    high_consumption_state = {
        "environment": base_environment,
        "energy": {
            "battery_level_pct": 90,
            "generation_kw": 15,
            "consumption_kw": 25,
        },
    }

    healthy_hours = predict_battery_hours(
        healthy_state
    )

    low_battery_hours = predict_battery_hours(
        low_battery_state
    )

    high_consumption_hours = predict_battery_hours(
        high_consumption_state
    )

    print("\n==============================")
    print("BATTERY SANITY CHECK")
    print("==============================")

    print(
        f"\nHealthy battery: "
        f"{healthy_hours} hours"
    )

    print(
        f"Low battery: "
        f"{low_battery_hours} hours"
    )

    print(
        f"High consumption: "
        f"{high_consumption_hours} hours"
    )

    # -----------------------------------------------------
    # Logical checks
    # -----------------------------------------------------

    assert low_battery_hours < healthy_hours, (
        "ERROR: Lower battery should result "
        "in fewer remaining hours."
    )

    assert high_consumption_hours < healthy_hours, (
        "ERROR: Higher consumption should result "
        "in fewer remaining hours."
    )

    print(
        "\n✓ Lower battery reduces endurance."
    )

    print(
        "✓ Higher consumption reduces endurance."
    )


def test_cascading_effect():
    """
    Verify that a severe storm reduces battery endurance
    compared with normal weather.
    """

    normal_state = {
        "environment": {
            "temperature_c": -15,
            "wind_speed_ms": 5,
            "pressure_hpa": 1010,
            "visibility_km": 20,
        },

        "energy": {
            "battery_level_pct": 80,
            "generation_kw": 14,
            "consumption_kw": 12,
        },
    }

    storm_state = {
        "environment": {
            "temperature_c": -35,
            "wind_speed_ms": 30,
            "pressure_hpa": 950,
            "visibility_km": 1,
        },

        "energy": {
            "battery_level_pct": 80,
            "generation_kw": 14,
            "consumption_kw": 12,
        },
    }

    normal_result = predict_cascading_risk(
        normal_state
    )

    storm_result = predict_cascading_risk(
        storm_state
    )

    print("\n==============================")
    print("CASCADING RISK CHECK")
    print("==============================")

    print(
        f"\nNormal weather:"
    )

    print(
        f"  Storm risk: "
        f"{normal_result['storm_risk']}"
    )

    print(
        f"  Battery: "
        f"{normal_result['battery_hours_remaining']} hours"
    )

    print(
        f"\nSevere storm:"
    )

    print(
        f"  Storm risk: "
        f"{storm_result['storm_risk']}"
    )

    print(
        f"  Battery: "
        f"{storm_result['battery_hours_remaining']} hours"
    )

    # -----------------------------------------------------
    # Critical cascading check
    # -----------------------------------------------------

    assert (
        storm_result["battery_hours_remaining"]
        < normal_result["battery_hours_remaining"]
    ), (
        "ERROR: Severe storm should reduce "
        "battery endurance."
    )

    print(
        "\n✓ Storm reduces projected battery endurance."
    )


def run_all_tests():
    """Run all AURORA ML sanity checks."""

    test_storm_scenarios()

    test_battery_scenarios()

    test_cascading_effect()

    print("\n==============================")
    print("ALL VALIDATION CHECKS PASSED")
    print("==============================")


if __name__ == "__main__":
    run_all_tests()
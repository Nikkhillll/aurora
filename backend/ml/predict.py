"""
AURORA ML Prediction Interface.

This module provides the clean callable functions used by
the rest of the AURORA backend.

Models:
    1. Storm-risk classification
    2. Battery endurance regression

Cascading logic:
    Storm risk modifies expected generation and consumption
    before the battery forecast is calculated.
"""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd


# =========================================================
# Paths
# =========================================================

MODEL_DIR = Path(__file__).resolve().parent / "artifacts"

STORM_MODEL_PATH = MODEL_DIR / "storm_model.joblib"
ENERGY_MODEL_PATH = MODEL_DIR / "energy_model.joblib"


# =========================================================
# Model features
# =========================================================

STORM_FEATURES = [
    "temperature_c",
    "wind_speed_ms",
    "pressure_hpa",
    "visibility_km",
]

ENERGY_FEATURES = [
    "battery_level_pct",
    "generation_kw",
    "consumption_kw",
    "temperature_c",
    "wind_speed_ms",
]


# =========================================================
# Model cache
# =========================================================

_storm_model = None
_energy_model = None


def _load_storm_model():
    """Load the storm model once and reuse it."""

    global _storm_model

    if _storm_model is None:

        if not STORM_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Storm model not found: {STORM_MODEL_PATH}"
            )

        _storm_model = joblib.load(
            STORM_MODEL_PATH
        )

    return _storm_model


def _load_energy_model():
    """Load the energy model once and reuse it."""

    global _energy_model

    if _energy_model is None:

        if not ENERGY_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Energy model not found: {ENERGY_MODEL_PATH}"
            )

        _energy_model = joblib.load(
            ENERGY_MODEL_PATH
        )

    return _energy_model


# =========================================================
# Storm prediction
# =========================================================

def predict_storm_risk(
    conditions: dict,
) -> str:
    """
    Predict storm risk.

    Parameters
    ----------
    conditions:
        Dictionary containing:

        temperature_c
        wind_speed_ms
        pressure_hpa
        visibility_km

    Returns
    -------
    str
        low / medium / high
    """

    missing = [
        feature
        for feature in STORM_FEATURES
        if feature not in conditions
    ]

    if missing:
        raise ValueError(
            f"Missing storm inputs: {missing}"
        )

    input_data = pd.DataFrame(
        [
            {
                feature: float(
                    conditions[feature]
                )
                for feature in STORM_FEATURES
            }
        ]
    )

    model = _load_storm_model()

    prediction = model.predict(
        input_data
    )[0]

    prediction = str(
        prediction
    ).lower()

    valid_risks = {
        "low",
        "medium",
        "high",
    }

    if prediction not in valid_risks:
        raise ValueError(
            f"Invalid storm prediction: {prediction}"
        )

    return prediction


# =========================================================
# Storm probabilities
# =========================================================

def predict_storm_probabilities(
    conditions: dict,
) -> dict:
    """Return probability estimates for each storm class."""

    missing = [
        feature
        for feature in STORM_FEATURES
        if feature not in conditions
    ]

    if missing:
        raise ValueError(
            f"Missing storm inputs: {missing}"
        )

    input_data = pd.DataFrame(
        [
            {
                feature: float(
                    conditions[feature]
                )
                for feature in STORM_FEATURES
            }
        ]
    )

    model = _load_storm_model()

    probabilities = model.predict_proba(
        input_data
    )[0]

    return {
        str(label): float(probability)
        for label, probability in zip(
            model.classes_,
            probabilities,
        )
    }


# =========================================================
# Storm impact
# =========================================================

def apply_storm_impact(
    generation_kw: float,
    consumption_kw: float,
    storm_risk: str,
) -> tuple[float, float]:
    """
    Apply expected storm effects to energy generation
    and consumption.

    The adjustments represent a simplified operational model:

        LOW:
            No major adjustment.

        MEDIUM:
            Lower generation.
            Higher consumption.

        HIGH:
            Significant generation reduction.
            Significant consumption increase.

    Returns
    -------
    tuple
        adjusted_generation_kw,
        adjusted_consumption_kw
    """

    storm_risk = storm_risk.lower()

    if storm_risk == "low":

        generation_factor = 1.00
        consumption_factor = 1.00

    elif storm_risk == "medium":

        generation_factor = 0.85
        consumption_factor = 1.15

    elif storm_risk == "high":

        generation_factor = 0.60
        consumption_factor = 1.35

    else:
        raise ValueError(
            f"Unknown storm risk: {storm_risk}"
        )

    adjusted_generation = (
        generation_kw
        * generation_factor
    )

    adjusted_consumption = (
        consumption_kw
        * consumption_factor
    )

    return (
        adjusted_generation,
        adjusted_consumption,
    )


# =========================================================
# Battery prediction
# =========================================================

def predict_battery_hours(
    state: dict,
) -> float:
    """
    Predict remaining battery endurance.

    The storm risk is first predicted from environmental
    conditions.

    The predicted storm then modifies generation and
    consumption before being passed to the energy model.

    Parameters
    ----------
    state:
        Expected structure:

        {
            "environment": {
                "temperature_c": -30,
                "wind_speed_ms": 25,
                "pressure_hpa": 970,
                "visibility_km": 2
            },

            "energy": {
                "battery_level_pct": 80,
                "generation_kw": 12,
                "consumption_kw": 14
            }
        }

    Returns
    -------
    float
        Predicted battery hours remaining.
    """

    if "environment" not in state:
        raise ValueError(
            "Missing 'environment' state"
        )

    if "energy" not in state:
        raise ValueError(
            "Missing 'energy' state"
        )

    environment = state["environment"]
    energy = state["energy"]

    # -----------------------------------------------------
    # Validate required energy fields
    # -----------------------------------------------------

    required_energy = [
        "battery_level_pct",
        "generation_kw",
        "consumption_kw",
    ]

    missing = [
        field
        for field in required_energy
        if field not in energy
    ]

    if missing:
        raise ValueError(
            f"Missing energy inputs: {missing}"
        )

    # -----------------------------------------------------
    # Predict storm
    # -----------------------------------------------------

    storm_risk = predict_storm_risk(
        environment
    )

    # -----------------------------------------------------
    # Apply cascading storm impact
    # -----------------------------------------------------

    adjusted_generation, adjusted_consumption = (
        apply_storm_impact(
            generation_kw=float(
                energy["generation_kw"]
            ),
            consumption_kw=float(
                energy["consumption_kw"]
            ),
            storm_risk=storm_risk,
        )
    )

    # -----------------------------------------------------
    # Prepare model input
    # -----------------------------------------------------

    model_input = pd.DataFrame(
        [
            {
                "battery_level_pct": float(
                    energy["battery_level_pct"]
                ),

                "generation_kw": adjusted_generation,

                "consumption_kw": adjusted_consumption,

                "temperature_c": float(
                    environment["temperature_c"]
                ),

                "wind_speed_ms": float(
                    environment["wind_speed_ms"]
                ),
            }
        ]
    )

    # -----------------------------------------------------
    # Predict
    # -----------------------------------------------------

    model = _load_energy_model()

    prediction = float(
        model.predict(model_input)[0]
    )

    # -----------------------------------------------------
    # Safety validation
    # -----------------------------------------------------

    prediction = max(
        0.5,
        min(
            prediction,
            72.0,
        ),
    )

    return round(
        prediction,
        2,
    )


# =========================================================
# Cascading prediction
# =========================================================

def predict_cascading_risk(
    state: dict,
) -> dict:
    """
    Run the complete AURORA prediction pipeline.

    Returns both the storm prediction and the battery
    forecast after applying the storm impact.
    """

    environment = state["environment"]

    energy = state["energy"]

    # -----------------------------------------------------
    # Storm prediction
    # -----------------------------------------------------

    storm_risk = predict_storm_risk(
        environment
    )

    probabilities = predict_storm_probabilities(
        environment
    )

    # -----------------------------------------------------
    # Original energy values
    # -----------------------------------------------------

    original_generation = float(
        energy["generation_kw"]
    )

    original_consumption = float(
        energy["consumption_kw"]
    )

    # -----------------------------------------------------
    # Apply storm impact
    # -----------------------------------------------------

    adjusted_generation, adjusted_consumption = (
        apply_storm_impact(
            original_generation,
            original_consumption,
            storm_risk,
        )
    )

    # -----------------------------------------------------
    # Battery prediction
    # -----------------------------------------------------

    battery_hours = predict_battery_hours(
        state
    )

    # -----------------------------------------------------
    # Return complete result
    # -----------------------------------------------------

    return {
        "storm_risk": storm_risk,

        "storm_probabilities": probabilities,

        "battery_hours_remaining": battery_hours,

        "original_generation_kw": round(
            original_generation,
            2,
        ),

        "adjusted_generation_kw": round(
            adjusted_generation,
            2,
        ),

        "original_consumption_kw": round(
            original_consumption,
            2,
        ),

        "adjusted_consumption_kw": round(
            adjusted_consumption,
            2,
        ),
    }


# =========================================================
# Manual test
# =========================================================

if __name__ == "__main__":

    test_state = {
        "environment": {
            "temperature_c": -30,
            "wind_speed_ms": 25,
            "pressure_hpa": 970,
            "visibility_km": 2,
        },

        "energy": {
            "battery_level_pct": 80,
            "generation_kw": 12,
            "consumption_kw": 14,
        },
    }

    print("\n")
    print("==============================")
    print("AURORA CASCADING PREDICTION")
    print("==============================")

    result = predict_cascading_risk(
        test_state
    )

    print(
        f"\nStorm risk: "
        f"{result['storm_risk'].upper()}"
    )

    print(
        "\nStorm probabilities:"
    )

    for risk, probability in result[
        "storm_probabilities"
    ].items():

        print(
            f"  {risk:>6}: "
            f"{probability * 100:.2f}%"
        )

    print(
        "\nEnergy:"
    )

    print(
        f"  Generation: "
        f"{result['original_generation_kw']} kW"
    )

    print(
        f"  Storm-adjusted generation: "
        f"{result['adjusted_generation_kw']} kW"
    )

    print(
        f"  Consumption: "
        f"{result['original_consumption_kw']} kW"
    )

    print(
        f"  Storm-adjusted consumption: "
        f"{result['adjusted_consumption_kw']} kW"
    )

    print(
        "\nBattery forecast:"
    )

    print(
        f"  {result['battery_hours_remaining']} "
        f"hours remaining"
    )
"""
Synthetic Antarctic environmental data generator.

Real Antarctic sensor data is not continuously available for this project,
so we generate realistic synthetic observations for model training.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def generate_storm_data(
    n_samples: int = 5000,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate synthetic Antarctic environmental observations.

    Features:
        temperature_c
        wind_speed_ms
        pressure_hpa
        visibility_km

    Target:
        storm_risk: low / medium / high

    Returns:
        pandas DataFrame
    """

    rng = np.random.default_rng(seed)

    # ---------------------------------------------------------
    # 1. Temperature
    # ---------------------------------------------------------
    # Antarctic conditions can be extremely cold.
    # We keep the generated values within a realistic range.
    temperature_c = rng.normal(
        loc=-25,
        scale=8,
        size=n_samples,
    )

    temperature_c = np.clip(
        temperature_c,
        -45,
        -5,
    )

    # ---------------------------------------------------------
    # 2. Wind speed
    # ---------------------------------------------------------
    # Most observations are moderate wind conditions,
    # with some observations representing severe storms.
    wind_speed_ms = rng.gamma(
        shape=3.0,
        scale=4.0,
        size=n_samples,
    )

    wind_speed_ms = np.clip(
        wind_speed_ms,
        0,
        35,
    )

    # ---------------------------------------------------------
    # 3. Atmospheric pressure
    # ---------------------------------------------------------
    # Lower pressure generally indicates more disturbed weather.
    pressure_hpa = rng.normal(
        loc=990,
        scale=18,
        size=n_samples,
    )

    pressure_hpa = np.clip(
        pressure_hpa,
        930,
        1035,
    )

    # ---------------------------------------------------------
    # 4. Visibility
    # ---------------------------------------------------------
    # Snow/blizzards can dramatically reduce visibility.
    visibility_km = rng.lognormal(
        mean=np.log(8),
        sigma=0.7,
        size=n_samples,
    )

    visibility_km = np.clip(
        visibility_km,
        0.2,
        30,
    )

    # ---------------------------------------------------------
    # 5. Create a domain-based storm severity score
    # ---------------------------------------------------------
    #
    # This is NOT the ML model.
    #
    # We use domain knowledge to create labels for our
    # synthetic training data.
    #

    wind_score = np.clip(
        (wind_speed_ms - 5) / 25,
        0,
        1,
    )

    pressure_score = np.clip(
        (1005 - pressure_hpa) / 50,
        0,
        1,
    )

    visibility_score = np.clip(
        (10 - visibility_km) / 10,
        0,
        1,
    )

    cold_score = np.clip(
        (-temperature_c - 15) / 25,
        0,
        1,
    )

    # Weighted combination.
    #
    # Wind and visibility are given more importance because
    # they are particularly useful indicators of hazardous
    # Antarctic operating conditions.
    storm_score = (
        0.40 * wind_score
        + 0.25 * pressure_score
        + 0.25 * visibility_score
        + 0.10 * cold_score
    )

    # Add a small amount of noise so that the ML model
    # doesn't simply learn perfectly clean mathematical
    # boundaries.
    storm_score += rng.normal(
        loc=0,
        scale=0.04,
        size=n_samples,
    )

    # ---------------------------------------------------------
    # 6. Convert score into risk classes
    # ---------------------------------------------------------

    storm_risk = np.select(
    [
        storm_score < 0.30,
        storm_score < 0.55,
    ],
    [
        "low",
        "medium",
    ],
    default="high",
)

    # ---------------------------------------------------------
    # 7. Build DataFrame
    # ---------------------------------------------------------

    data = pd.DataFrame(
        {
            "temperature_c": temperature_c,
            "wind_speed_ms": wind_speed_ms,
            "pressure_hpa": pressure_hpa,
            "visibility_km": visibility_km,
            "storm_risk": storm_risk,
        }
    )

    return data


if __name__ == "__main__":
    data = generate_storm_data()

    print("\nFirst 10 observations:")
    print(data.head(10))

    print("\nDataset shape:")
    print(data.shape)

    print("\nRisk distribution:")
    print(data["storm_risk"].value_counts())

    print("\nFeature statistics:")
    print(data.describe())
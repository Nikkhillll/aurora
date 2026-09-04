"""
Synthetic energy/battery dataset generator for AURORA.

The dataset represents realistic Antarctic station energy
conditions and is used to train the battery endurance model.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


BATTERY_CAPACITY_KWH = 120.0


def generate_energy_data(
    n_samples: int = 10000,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate synthetic energy observations.

    Features:
        battery_level_pct
        generation_kw
        consumption_kw
        temperature_c
        wind_speed_ms
        storm_risk

    Target:
        hours_remaining
    """

    rng = np.random.default_rng(seed)

    # ---------------------------------------------------------
    # Battery level
    # ---------------------------------------------------------

    battery_level_pct = rng.uniform(
        10,
        100,
        n_samples,
    )

    # ---------------------------------------------------------
    # Temperature
    # ---------------------------------------------------------

    temperature_c = rng.normal(
        -25,
        8,
        n_samples,
    )

    temperature_c = np.clip(
        temperature_c,
        -45,
        -5,
    )

    # ---------------------------------------------------------
    # Wind
    # ---------------------------------------------------------

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
    # Storm risk
    # ---------------------------------------------------------

    storm_score = (
        0.7 * np.clip((wind_speed_ms - 8) / 25, 0, 1)
        + 0.3 * np.clip((-temperature_c - 15) / 30, 0, 1)
    )

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
    # Base generation
    # ---------------------------------------------------------

    generation_kw = rng.normal(
        14,
        3,
        n_samples,
    )

    generation_kw = np.clip(
        generation_kw,
        2,
        22,
    )

    # Storm conditions reduce renewable generation.
    generation_kw -= np.where(
        storm_risk == "medium",
        2.0,
        0.0,
    )

    generation_kw -= np.where(
        storm_risk == "high",
        5.0,
        0.0,
    )

    generation_kw = np.clip(
        generation_kw,
        1,
        22,
    )

    # ---------------------------------------------------------
    # Base consumption
    # ---------------------------------------------------------

    consumption_kw = rng.normal(
        11,
        2,
        n_samples,
    )

    consumption_kw = np.clip(
        consumption_kw,
        5,
        20,
    )

    # ---------------------------------------------------------
    # Extremely cold weather increases energy demand
    # ---------------------------------------------------------

    cold_penalty = np.clip(
        (-temperature_c - 15) * 0.10,
        0,
        4,
    )

    consumption_kw += cold_penalty

    # ---------------------------------------------------------
    # Storm conditions increase consumption
    # ---------------------------------------------------------

    consumption_kw += np.where(
        storm_risk == "medium",
        2.0,
        0.0,
    )

    consumption_kw += np.where(
        storm_risk == "high",
        5.0,
        0.0,
    )

    # Small realistic variation
    consumption_kw += rng.normal(
        0,
        0.5,
        n_samples,
    )

    consumption_kw = np.clip(
        consumption_kw,
        5,
        30,
    )

    # ---------------------------------------------------------
    # Calculate available energy
    # ---------------------------------------------------------

    available_energy_kwh = (
        battery_level_pct / 100
    ) * BATTERY_CAPACITY_KWH

    # ---------------------------------------------------------
    # Net battery drain
    # ---------------------------------------------------------

    net_drain_kw = (
        consumption_kw - generation_kw
    )

    # ---------------------------------------------------------
    # Calculate hours remaining
    # ---------------------------------------------------------

    #
    # If generation exceeds consumption,
    # the battery is not currently draining.
    #
    # We still give a finite forecast based on
    # baseline station consumption.
    #

    effective_drain_kw = np.maximum(
        net_drain_kw,
        1.0,
    )

    hours_remaining = (
        available_energy_kwh
        / effective_drain_kw
    )

    # Add small measurement/model uncertainty.
    hours_remaining += rng.normal(
        0,
        0.5,
        n_samples,
    )

    # Physical bounds.
    hours_remaining = np.clip(
        hours_remaining,
        0.5,
        72.0,
    )

    # ---------------------------------------------------------
    # Build dataset
    # ---------------------------------------------------------

    data = pd.DataFrame(
        {
            "battery_level_pct": battery_level_pct,
            "generation_kw": generation_kw,
            "consumption_kw": consumption_kw,
            "temperature_c": temperature_c,
            "wind_speed_ms": wind_speed_ms,
            "storm_risk": storm_risk,
            "hours_remaining": hours_remaining,
        }
    )

    return data


if __name__ == "__main__":

    df = generate_energy_data()

    print("\nFirst 10 observations:")
    print(df.head(10))

    print("\nDataset shape:")
    print(df.shape)

    print("\nStorm distribution:")
    print(df["storm_risk"].value_counts())

    print("\nHours remaining statistics:")
    print(df["hours_remaining"].describe())
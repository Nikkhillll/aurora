"""
AURORA Battery/Energy Forecasting Model.

This module trains a Random Forest regression model that predicts
the number of hours of battery endurance remaining.
"""

from __future__ import annotations

from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from .energy_data import generate_energy_data


# ---------------------------------------------------------
# Model configuration
# ---------------------------------------------------------

FEATURES = [
    "battery_level_pct",
    "generation_kw",
    "consumption_kw",
    "temperature_c",
    "wind_speed_ms",
]

TARGET = "hours_remaining"

MODEL_DIR = Path(__file__).resolve().parent / "artifacts"

ENERGY_MODEL_PATH = (
    MODEL_DIR / "energy_model.joblib"
)


# ---------------------------------------------------------
# Training
# ---------------------------------------------------------

def train_energy_model():
    """
    Generate synthetic energy data and train the battery
    endurance regression model.
    """

    # -----------------------------------------------------
    # 1. Generate training data
    # -----------------------------------------------------

    df = generate_energy_data(
        n_samples=10000,
        seed=42,
    )

    X = df[FEATURES]
    y = df[TARGET]

    # -----------------------------------------------------
    # 2. Train/test split
    # -----------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
    )

    # -----------------------------------------------------
    # 3. Create Random Forest regression model
    # -----------------------------------------------------

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1,
    )

    # -----------------------------------------------------
    # 4. Train
    # -----------------------------------------------------

    print("\nTraining energy model...")

    model.fit(
        X_train,
        y_train,
    )

    # -----------------------------------------------------
    # 5. Predict test data
    # -----------------------------------------------------

    predictions = model.predict(
        X_test
    )

    # -----------------------------------------------------
    # 6. Evaluate
    # -----------------------------------------------------

    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    rmse = mean_squared_error(
        y_test,
        predictions,
    ) ** 0.5

    r2 = r2_score(
        y_test,
        predictions,
    )

    print("\n==============================")
    print("ENERGY MODEL EVALUATION")
    print("==============================")

    print(
        f"\nMAE : {mae:.3f} hours"
    )

    print(
        f"RMSE: {rmse:.3f} hours"
    )

    print(
        f"R²  : {r2:.4f}"
    )

    # -----------------------------------------------------
    # 7. Feature importance
    # -----------------------------------------------------

    print("\nFeature importance:")

    importance = sorted(
        zip(
            FEATURES,
            model.feature_importances_,
        ),
        key=lambda x: x[1],
        reverse=True,
    )

    for feature, score in importance:
        print(
            f"{feature:>20}: {score:.4f}"
        )

    # -----------------------------------------------------
    # 8. Save model
    # -----------------------------------------------------

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        ENERGY_MODEL_PATH,
    )

    print("\nModel saved to:")
    print(ENERGY_MODEL_PATH)

    return model


# ---------------------------------------------------------
# Run training
# ---------------------------------------------------------

if __name__ == "__main__":
    train_energy_model()
"""
AURORA ML Models

Contains the training code for the storm-risk classifier.
"""

from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from .synthetic_data import generate_storm_data


# Features used by the model
FEATURES = [
    "temperature_c",
    "wind_speed_ms",
    "pressure_hpa",
    "visibility_km",
]

TARGET = "storm_risk"


# Where the trained model will be stored
MODEL_DIR = Path(__file__).resolve().parent / "artifacts"
STORM_MODEL_PATH = MODEL_DIR / "storm_model.joblib"


def train_storm_model():
    """Train and save the storm-risk classification model."""

    # 1. Generate synthetic training data
    df = generate_storm_data(
        n_samples=10000,
        seed=42,
    )

    X = df[FEATURES]
    y = df[TARGET]

    # 2. Split into training and testing data
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    # 3. Create Random Forest classifier
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    # 4. Train
    model.fit(X_train, y_train)

    # 5. Predict test data
    predictions = model.predict(X_test)

    # 6. Evaluate
    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    print("\n==============================")
    print("STORM MODEL EVALUATION")
    print("==============================")

    print(f"\nAccuracy: {accuracy:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
        )
    )

    # 7. Save model
    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        model,
        STORM_MODEL_PATH,
    )

    print("\nModel saved to:")
    print(STORM_MODEL_PATH)

    return model


if __name__ == "__main__":
    train_storm_model()
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

from app.core.config import MODEL_PATH, COLUMNS_PATH

# Ensure directory exists
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

def train():
    print("Training started...")

    # Load dataset
    df = pd.read_csv("Training.csv")

    # Clean dataset
    df = df.loc[:, ~df.columns.str.contains("^Unnamed")]

    # Split features and target
    X = df.drop("prognosis", axis=1)
    y = df["prognosis"]

    # Train model
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X, y)

    # Save model and columns
    joblib.dump(model, MODEL_PATH)
    joblib.dump(X.columns.tolist(), COLUMNS_PATH)

    print(" Model saved at:", MODEL_PATH)
    print("Columns saved at:", COLUMNS_PATH)


if __name__ == "__main__":
    train()
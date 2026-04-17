import joblib
import numpy as np
from app.utils.mapping import disease_to_specialty

# Load model once (important for performance)
model = joblib.load("app/model/model.pkl")
columns = joblib.load("app/model/columns.pkl")

def predict(symptoms):
    input_data = np.zeros(len(columns))

    for s in symptoms:
        if s in columns:
            idx = columns.index(s)
            input_data[idx] = 1

    input_data = input_data.reshape(1, -1)

    prediction = model.predict(input_data)[0]
    probs = model.predict_proba(input_data)[0]

    specialty = disease_to_specialty.get(prediction, "General Physician")

    return {
        "prediction": prediction,
        "specialty": specialty,
        "confidence": float(max(probs))
    }
from pydantic import BaseModel, field_validator
from typing import List

class PredictRequest(BaseModel):
    symptoms: List[str]

    # Validate list not empty
    @field_validator("symptoms")
    def validate_not_empty(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Symptoms list cannot be empty")
        return v

    #Limit number of symptoms
    @field_validator("symptoms")
    def validate_length(cls, v):
        if len(v) < 1:
            raise ValueError("At least 1 symptom required")
        if len(v) > 20:
            raise ValueError("Maximum 20 symptoms allowed")
        return v

    # Clean + normalize input
    @field_validator("symptoms")
    def normalize_symptoms(cls, v):
        return [s.strip().lower() for s in v]

    # Remove duplicates
    @field_validator("symptoms")
    def remove_duplicates(cls, v):
        return list(set(v))
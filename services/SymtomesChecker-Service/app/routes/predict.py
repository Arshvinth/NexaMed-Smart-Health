from fastapi import APIRouter
from app.schemas.predict_schema import PredictRequest
from app.service.predict_service import predict

router = APIRouter(prefix="/api")

@router.post("/predict")
def predict_disease(data: PredictRequest):
    return predict(data.symptoms)
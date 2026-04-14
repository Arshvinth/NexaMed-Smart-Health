from fastapi import FastAPI
from app.routes.predict import router as predict_router

app=FastAPI( title="AI Symptom Checker Service")

@app.get("/")
def home():
    return {
        "message":"AI Engine Running"
    }

app.include_router(predict_router)
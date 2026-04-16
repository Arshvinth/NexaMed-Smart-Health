import mongoose from "mongoose";

const predictionScheama = new mongoose.Schema({
    userId: String,
    symptoms: [String],
    disease: String,
    specialty: String,
    confidence: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Prediction", predictionScheama);
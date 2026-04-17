import Prediction from "../model/Prediction.js";
import { getPrediction } from "./AiService.js";


export const handlePrediction = async ({ symptoms, userId }) => {
    const aiResult = await getPrediction(symptoms);

    const saved = await Prediction.create({
        userId,
        symptoms,
        disease: aiResult.prediction,
        specialty: aiResult.specialty,
        confidence: aiResult.confidence
    });

    return saved;
};


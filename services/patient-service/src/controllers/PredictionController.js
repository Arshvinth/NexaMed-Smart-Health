import { handlePrediction } from "../services/PredictionService.js";

export const predict = async (req, res) => {
    try {
        const result = await handlePrediction({
            symptoms: req.body.symptoms,
            userId: "demoUser"
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


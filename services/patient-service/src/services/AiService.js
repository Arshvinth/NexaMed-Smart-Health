import axios from "axios";

export const getPrediction = async (symptoms) => {
    const response = await axios.post(
        `${process.env.AI_SERVICE_URL}/api/predict`,
        { symptoms }
    );

    return response.data;
}
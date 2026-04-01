import mongoose from "mongoose"
import logger from "../utils/Logger";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info("MongoDB Connected Successfully");

    }
    catch (err) {
        logger.error(`MongoDb Coonection Failed:${err.message}`);
        process.exit(1);
    }
}
import mongoose from "mongoose"
import logger from "../utils/Logger.js";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info("MongoDB Connected Successfully");

    }
    catch (err) {
        logger.error(`MongoDb Coonection Failed:${err.message}`);
        process.exit(1);
    }
}

export default connectDB;
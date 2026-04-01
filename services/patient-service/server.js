import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import connectDB from "./src/config/db";
import logger from "./src/utils/Logger";

dotenv.config();

const app = express();

//set secure for http headers
app.use(helmet());

app.use(cors());

//security for prevent large payload
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}))

//security for brute force attack
const limitter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many request from this Ip.Please try again later..."
});

app.use("/api", limitter);

//start server
const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            logger.info(`Server running on Port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Server failed to start:${error.message}`);
        process.exit(1);
    }
};

startServer();
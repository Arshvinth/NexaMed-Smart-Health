import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import connectDB from "./config/db.js";
import logger from "./utils/Logger.js";
import medicalReportsRouter from "./route/medicalReports.js";
import prescriptionsRouter from "./route/prescriptions.js";
import profileRouter from "./route/profileRoute.js";
import predictRoute from "./route/predictRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

app.set('trust proxy', true);

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
    message: "Too many request from this Ip.Please try again later...",
    trustProxy: false,
    validate: { trustProxy: false }
});

app.use("/api", limitter);

// Routes
app.use('/api/medical-reports', medicalReportsRouter);
app.use('/api/prescription', prescriptionsRouter);
app.use('/api/patients', profileRouter);
app.use('/api/prediction', predictRoute)



// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
    }
    if (error.message.includes('Only these files')) {
        return res.status(400).json({ message: error.message });
    }
    next(error);
});

// Kubernetes health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

//start server
const PORT = process.env.PORT || 8081;

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
/**
 * app.js
 * Creates and configures the Express app (exported for testing / reuse).
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import requestLogger from "./middlewares/requestLogger.js";
import errorHandler from "./middlewares/errorHandler.js";
import sessionRoutes from "./routes/sessionRoutes.js";

const app = express();

// Parse JSON requests
app.use(express.json());

// CORS configuration (allow frontend origin)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Log HTTP requests in non-production
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Small custom logger (mirrors doctor-service style)
app.use(requestLogger);

// Rate limiting for API routes
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/**
 * Health check endpoint
 * Used by Postman, Docker, Kubernetes probes, etc.
 */
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "telemedicine-service OK" });
});

// Telemedicine session routes
app.use("/api", sessionRoutes);

// Central error handler must be last
app.use(errorHandler);

export default app;
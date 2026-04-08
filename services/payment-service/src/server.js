import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { postStripeWebhook } from "./controllers/paymentController.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import asyncHandler from "./utils/asyncHandler.js";

dotenv.config();

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();

// CORS (same as doctor-service)
const rawOrigins = process.env.CORS_ORIGIN || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin))
      return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
});
app.use("/api", limiter);

// Webhook must use raw body – placed before express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  },
  asyncHandler(postStripeWebhook),
);

// Regular JSON middleware for all other routes
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "payment-service" }),
);
app.get("/", (_req, res) => res.send("Payment Service API running"));

// API routes
app.use("/api/payments", paymentRoutes);

// Error handler
app.use(errorHandler);

const port = process.env.PORT || 5004;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () =>
    console.log(`[payment-service] Server running on port ${port}`),
  );
}

export default app;

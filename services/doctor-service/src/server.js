import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();
// DB
import { connectDB } from "./config/db.js";
// Middleware
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import doctorRoutes from "./routes/doctorRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";

// connectDB();
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();

/* ===========================
   CORS (comma-separated allowlist)
=========================== */
const rawOrigins = process.env.CORS_ORIGIN || "";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman / server-to-server
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: origin not allowed"));
  },
  credentials: true
};

app.use(cors(corsOptions));

/* ===========================
   Rate limit for /api
=========================== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP"
});
app.use("/api", limiter);

/* ===========================
   Middleware
=========================== */
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use(requestLogger);

/* ===========================
   Routes
=========================== */
// Health endpoint for Kubernetes readiness/liveness checks
app.get("/health", (_req, res) => res.json({ status: "ok", service: "doctor-service" }));

app.use("/api/doctors", doctorRoutes);
app.use("/api/doctors", availabilityRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

app.get("/", (_req, res) => res.send("Doctor Service API running"));

/* ===========================
   Centralized error handler
=========================== */
app.use(errorHandler);

/* ===========================
   START SERVER (Only if not test)
=========================== */
const port = process.env.PORT || 5002;

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`[doctor-service] Server running on port ${port}`));
}

/* ===========================
   EXPORT APP FOR TESTING
=========================== */
export default app;
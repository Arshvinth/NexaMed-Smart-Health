import dotenv from "dotenv";
import express from "express";
import http from "http";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

// DB
import { connectDB } from "./config/db.js";

// Middleware
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Routes
import appointmentRoutes from "./routes/appointmentRoutes.js";

// Socket.IO
import { initSocket } from "./services/socketService.js";

// Connect to DB (skip in test)
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();

// CORS (comma-separated allowlist)
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

// Rate limit for /api
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
});
app.use("/api", limiter);

// Middleware
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use(requestLogger);

// Routes
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "appointment-service" }),
);
app.use("/api/appointments", appointmentRoutes);
app.get("/", (_req, res) => res.send("Appointment Service API running"));

// Centralized error handler
app.use(errorHandler);

/* Start server (Only if not test)
   - Create HTTP server, attach Socket.IO, then listen
 */
const port = process.env.PORT || 5003;

if (process.env.NODE_ENV !== "test") {
  const server = http.createServer(app);
  initSocket(server); // attach WebSocket
  server.listen(port, () => {
    console.log(
      `[appointment-service] Server running on port ${port} with WebSocket support`,
    );
  });
}

// Export app for testing
export default app;

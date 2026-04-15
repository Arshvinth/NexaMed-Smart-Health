import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const doctorServiceUrl =
  process.env.DOCTOR_SERVICE_URL || "http://localhost:5002";
const telemedicineServiceUrl =
  process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5005";
const appointmentServiceUrl =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";
const paymentServiceUrl =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:5004";
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "api-gateway",
    upstreams: {
      doctor: doctorServiceUrl,
      appointment: appointmentServiceUrl,
      telemedicine: telemedicineServiceUrl,
      payment: paymentServiceUrl,
    },
  });
});

// Helper to build proxy with WebSocket support
function buildProxy(target, pathFilter, options = {}) {
  return createProxyMiddleware({
    target,
    pathFilter,
    changeOrigin: true,
    xfwd: true,
    ws: true, // Enable WebSocket proxying
    onError: (err, _req, res) => {
      res.status(502).json({
        message: "Bad gateway",
        details: err.message,
      });
    },
    ...options,
  });
}

// Doctor service routes
app.use(
  buildProxy(doctorServiceUrl, (path) => {
    return (
      path.startsWith("/api/doctors") || path.startsWith("/api/prescriptions")
    );
  }),
);

// Appointment service routes (HTTP)
app.use(
  buildProxy(appointmentServiceUrl, (path) => {
    return path.startsWith("/api/appointments");
  }),
);

// Telemedicine service routes
app.use(
  buildProxy(telemedicineServiceUrl, (path) => {
    return path.startsWith("/api/sessions");
  }),
);

// Payment service routes
app.use(
  buildProxy(paymentServiceUrl, (path) => {
    return path.startsWith("/api/payments");
  }),
);

// Socket.IO proxy (WebSocket) – only create the proxy, do not use app.use for WebSocket
// We'll attach upgrade handling in server.js
export const socketProxy = buildProxy(appointmentServiceUrl, (path) => {
  return path.startsWith("/socket.io/");
});

// Default route for unmatched HTTP requests
app.use((_req, res) => {
  res.status(404).json({
    message: "Gateway route not found",
  });
});

export default app;

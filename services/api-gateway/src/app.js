import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const gatewayPort = Number(process.env.PORT || 5000);
const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || "http://localhost:5002";
const telemedicineServiceUrl = process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5005";
const appointmentServiceUrl =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
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
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "api-gateway",
    port: gatewayPort,
    upstreams: {
      doctor: doctorServiceUrl,
      appointment: appointmentServiceUrl,
      telemedicine: telemedicineServiceUrl,
    },
  });
});

function buildProxy(target, pathFilter) {
  return createProxyMiddleware({
    target,
    pathFilter,
    changeOrigin: true,
    xfwd: true,
    onError: (err, _req, res) => {
      res.status(502).json({
        message: "Bad gateway",
        details: err.message,
      });
    },
  });
}

app.use(
  buildProxy(doctorServiceUrl, (path) => {
    return path.startsWith("/api/doctors") || path.startsWith("/api/prescriptions");
  })
);

app.use(
  buildProxy(appointmentServiceUrl, (path) => {
    return path.startsWith("/api/appointments");
  })
);

app.use(
  buildProxy(telemedicineServiceUrl, (path) => {
    return path.startsWith("/api/sessions");
  })
);

app.use((_req, res) => {
  res.status(404).json({
    message: "Gateway route not found",
  });
});

export default app;

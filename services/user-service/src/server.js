import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { seedAdminIfNeeded } from "./config/seedAdmin.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "user-service" }));

app.use("/api/auth", authRoutes);

app.use((err, _req, res, _next) => {
  console.error("[user-service] error:", err);
  res.status(err.statusCode || 500).json({ message: err.message || "Internal server error" });
});

app.use("/api/admin", adminRoutes);

const port = process.env.PORT || 5001;

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("[user-service] MongoDB connected");

  await seedAdminIfNeeded();

  app.listen(port, () => {
    console.log(`[user-service] running on ${port}`);
  });
}

if (process.env.NODE_ENV !== "test") start();

export default app;
/**
 * sessionRoutes
 * Defines telemedicine session endpoints.
 */

import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middlewares/requireAuthDev.js";
import { createSession, getSession } from "../controllers/sessionController.js";

const router = Router();

// Apply dev-mode auth headers requirement to all /api routes in this router
router.use(requireAuth);

// Both doctor and patient can create/get session links in MVP
router.post("/sessions", asyncHandler(createSession));
router.get("/sessions/:appointmentId", asyncHandler(getSession));

export default router;
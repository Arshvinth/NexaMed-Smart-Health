import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  postCreatePaymentIntent,
  getPayment,
  postConfirmAppointment,
} from "../controllers/paymentController.js";

const router = Router();

// All routes require authentication (webhook is handled separately in server.js)
router.use(auth);

router.post(
  "/create-intent",
  requireRole("PATIENT"),
  asyncHandler(postCreatePaymentIntent),
);

router.post(
  "/confirm-appointment",
  requireRole("PATIENT"),
  asyncHandler(postConfirmAppointment),
);

router.get("/:id", requireRole("PATIENT", "DOCTOR"), asyncHandler(getPayment));

export default router;

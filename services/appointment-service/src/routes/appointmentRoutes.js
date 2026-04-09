import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getSlots,
  postAppointment,
  putConfirmAppointment,
  patchCancelAppointment,
  patchCompleteAppointment,
  postRescheduleAppointment,
  getMyAppointments,
  getAppointment,
} from "../controllers/appointmentController.js";

const router = Router();
router.use(auth);

router.get("/slots", asyncHandler(getSlots));
router.post("/", requireRole("PATIENT"), asyncHandler(postAppointment));
router.put(
  "/:id/confirm",
  requireRole("PATIENT"), // only PATIENT – but payment service will act as patient
  asyncHandler(putConfirmAppointment),
);
router.patch(
  "/:id/cancel",
  requireRole("PATIENT", "DOCTOR"),
  asyncHandler(patchCancelAppointment),
);
router.patch(
  "/:id/complete",
  requireRole("DOCTOR"),
  asyncHandler(patchCompleteAppointment),
);
router.post(
  "/:id/reschedule",
  requireRole("PATIENT"),
  asyncHandler(postRescheduleAppointment),
);
router.get(
  "/me",
  requireRole("PATIENT", "DOCTOR"),
  asyncHandler(getMyAppointments),
);
router.get(
  "/:id",
  requireRole("PATIENT", "DOCTOR"),
  asyncHandler(getAppointment),
);

export default router;

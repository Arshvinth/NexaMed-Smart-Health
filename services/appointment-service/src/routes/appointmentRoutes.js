import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import { internalAuth } from "../middlewares/internalAuth.js";
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

router.put("/:id/confirm", internalAuth, asyncHandler(putConfirmAppointment));

router.use(auth);

router.get("/slots", asyncHandler(getSlots));
router.post("/", requireRole("PATIENT"), asyncHandler(postAppointment));
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

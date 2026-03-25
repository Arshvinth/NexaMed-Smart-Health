import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireVerifiedDoctor } from "../middleware/requireVerifiedDoctor.js";
import {
  postMyAvailability,
  getMyAvailability,
  deleteMyAvailability,
  getDoctorAvailability
} from "../controllers/availabilityController.js";

const router = Router();

// Doctor manages own availability (requires DOCTOR + VERIFIED)
router.post("/me/availability", auth, requireRole("DOCTOR"), requireVerifiedDoctor, postMyAvailability);
router.get("/me/availability", auth, requireRole("DOCTOR"), getMyAvailability);
router.delete(
  "/me/availability/:availabilityId",
  auth,
  requireRole("DOCTOR"),
  requireVerifiedDoctor,
  deleteMyAvailability
);

// Public endpoint: patient can view a doctor's availability by doctorUserId
router.get("/:doctorUserId/availability", getDoctorAvailability);

export default router;
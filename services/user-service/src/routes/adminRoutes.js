import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  getPendingDoctorsHandler,
  updateDoctorStatusHandler
} from "../controllers/adminController.js";

const router = Router();

// Admin only
router.get("/doctors/pending", auth, requireRole("ADMIN"), getPendingDoctorsHandler);
router.patch(
  "/doctors/:userId/verification-status",
  auth,
  requireRole("ADMIN"),
  updateDoctorStatusHandler
);

export default router;
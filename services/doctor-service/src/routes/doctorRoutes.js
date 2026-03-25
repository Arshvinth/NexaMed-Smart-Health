import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { getMe, putMe, listDoctors, getDoctorById } from "../controllers/doctorController.js";

const router = Router();

// Public listing for patients
router.get("/", listDoctors);

// Public profile lookup by MongoDB _id (only if VERIFIED)
router.get("/:doctorId", getDoctorById);

// Doctor self-profile routes (secured)
router.get("/me/profile", auth, requireRole("DOCTOR"), getMe);
router.put("/me/profile", auth, requireRole("DOCTOR"), putMe);

export default router;
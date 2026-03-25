import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireVerifiedDoctor } from "../middleware/requireVerifiedDoctor.js";
import { postPrescription, getPrescriptions, getPrescription } from "../controllers/prescriptionController.js";

const router = Router();

// Only VERIFIED doctors can create prescriptions
router.post("/", auth, requireRole("DOCTOR"), requireVerifiedDoctor, postPrescription);

// Doctors/patients can list prescriptions (controller enforces ownership)
router.get("/", auth, requireRole("DOCTOR", "PATIENT"), getPrescriptions);

// Doctors/patients can fetch a single prescription (controller enforces ownership)
router.get("/:id", auth, requireRole("DOCTOR", "PATIENT"), getPrescription);

export default router;
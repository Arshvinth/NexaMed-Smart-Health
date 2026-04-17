import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireVerifiedDoctor } from "../middleware/requireVerifiedDoctor.js";
import {
	postPrescription,
	getPrescriptions,
	getPrescription,
	putPrescription,
	deletePrescription
} from "../controllers/prescriptionController.js";

const router = Router();

// Only VERIFIED doctors can create prescriptions
router.post("/", auth, requireRole("DOCTOR"), requireVerifiedDoctor, postPrescription);

// Doctors/patients can list prescriptions (controller enforces ownership)
router.get("/", auth, requireRole("DOCTOR", "PATIENT"), getPrescriptions);

// Doctors/patients can fetch a single prescription (controller enforces ownership)
router.get("/:id", auth, requireRole("DOCTOR", "PATIENT"), getPrescription);

// Doctor can update a prescription they own
router.put("/:id", auth, requireRole("DOCTOR"), requireVerifiedDoctor, putPrescription);

// Doctor can delete a prescription they own
router.delete("/:id", auth, requireRole("DOCTOR"), requireVerifiedDoctor, deletePrescription);

export default router;
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  registerPatientHandler,
  registerDoctorHandler,
  loginHandler,
  getUserByIdHandler,
  getCurrentUserHandler
} from "../controllers/authController.js";

const router = Router();

router.post("/register/patient", registerPatientHandler);
router.post("/register/doctor", registerDoctorHandler);
router.post("/login", loginHandler);
router.get("/me", auth, getCurrentUserHandler);

// ADMIN only
router.get("/users/:userId", auth, requireRole("ADMIN"), getUserByIdHandler);

export default router;
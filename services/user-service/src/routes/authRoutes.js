import { Router } from "express";
import {
  registerPatientHandler,
  registerDoctorHandler,
  loginHandler
} from "../controllers/authController.js";

const router = Router();

router.post("/register/patient", registerPatientHandler);
router.post("/register/doctor", registerDoctorHandler);
router.post("/login", loginHandler);

export default router;
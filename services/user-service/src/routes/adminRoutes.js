import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  getPendingDoctorsHandler,
  updateDoctorStatusHandler,
  listUsersHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler
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

// Admin user management
router.get("/users", auth, requireRole("ADMIN"), listUsersHandler);
router.post("/users", auth, requireRole("ADMIN"), createUserHandler);
router.patch("/users/:userId", auth, requireRole("ADMIN"), updateUserHandler);
router.delete("/users/:userId", auth, requireRole("ADMIN"), deleteUserHandler);

export default router;
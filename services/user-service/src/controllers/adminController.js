import {
  listPendingDoctors,
  updateDoctorVerificationStatus
} from "../services/adminService.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function getPendingDoctorsHandler(req, res, next) {
  try {
    const doctors = await listPendingDoctors();
    res.json(doctors.map(sanitizeUser));
  } catch (e) {
    next(e);
  }
}

export async function updateDoctorStatusHandler(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const updated = await updateDoctorVerificationStatus(userId, status);
    res.json({
      message: "Doctor verification status updated",
      user: sanitizeUser(updated)
    });
  } catch (e) {
    next(e);
  }
}
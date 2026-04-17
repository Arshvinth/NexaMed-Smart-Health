import {
  listPendingDoctors,
  updateDoctorVerificationStatus,
  listUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin
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
    if (!status) return res.status(400).json({ message: "status is required" });

    const updated = await updateDoctorVerificationStatus(userId, status);
    res.json({ message: "Doctor verification status updated", user: sanitizeUser(updated) });
  } catch (e) {
    next(e);
  }
}

export async function listUsersHandler(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const q = req.query.q || "";
    const role = req.query.role || "";

    const result = await listUsers({ page, limit, q, role });
    res.json({
      ...result,
      items: result.items.map(sanitizeUser),
    });
  } catch (e) {
    next(e);
  }
}

export async function createUserHandler(req, res, next) {
  try {
    const { fullName, email, password, role, verificationStatus } = req.body || {};
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "fullName, email, password, role are required" });
    }

    const user = await createUserByAdmin({ fullName, email, password, role, verificationStatus });
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (e) {
    next(e);
  }
}

export async function updateUserHandler(req, res, next) {
  try {
    const user = await updateUserByAdmin(req.params.userId, req.body || {});
    res.json({ user: sanitizeUser(user) });
  } catch (e) {
    next(e);
  }
}

export async function deleteUserHandler(req, res, next) {
  try {
    await deleteUserByAdmin(req.params.userId);
    res.json({ message: "User deleted" });
  } catch (e) {
    next(e);
  }
}
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

export async function listPendingDoctors() {
  return User.find(
    { role: "DOCTOR", verificationStatus: "PENDING" },
    { passwordHash: 0 }
  ).sort({ createdAt: -1 });
}

export async function updateDoctorVerificationStatus(userId, status) {
  const allowed = ["VERIFIED", "REJECTED"];
  if (!allowed.includes(status)) {
    const err = new Error("status must be VERIFIED or REJECTED");
    err.statusCode = 400;
    throw err;
  }

  const doctor = await User.findOne({ _id: userId, role: "DOCTOR" });
  if (!doctor) {
    const err = new Error("Doctor user not found");
    err.statusCode = 404;
    throw err;
  }

  doctor.verificationStatus = status;
  await doctor.save();

  return doctor;
}

export async function listUsers({ page = 1, limit = 10, q = "", role = "" }) {
  const skip = (page - 1) * limit;

  const filter = {};
  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }
  if (role) filter.role = role;

  const [items, total] = await Promise.all([
    User.find(filter, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function createUserByAdmin({
  fullName,
  email,
  password,
  role,
  verificationStatus,
}) {
  const allowedRoles = ["PATIENT", "DOCTOR", "ADMIN"];
  if (!allowedRoles.includes(role)) {
    const err = new Error("role must be PATIENT, DOCTOR, or ADMIN");
    err.statusCode = 400;
    throw err;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const defaultStatus =
    role === "DOCTOR" ? "PENDING" : "VERIFIED";

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role,
    verificationStatus: verificationStatus || defaultStatus,
  });

  return user;
}

export async function updateUserByAdmin(userId, patch) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  if (patch.fullName !== undefined) user.fullName = patch.fullName;
  if (patch.email !== undefined) user.email = patch.email.toLowerCase();

  if (patch.role !== undefined) {
    const allowedRoles = ["PATIENT", "DOCTOR", "ADMIN"];
    if (!allowedRoles.includes(patch.role)) {
      const err = new Error("Invalid role");
      err.statusCode = 400;
      throw err;
    }
    user.role = patch.role;
  }

  if (patch.verificationStatus !== undefined) {
    const allowedStatus = ["PENDING", "VERIFIED", "REJECTED"];
    if (!allowedStatus.includes(patch.verificationStatus)) {
      const err = new Error("Invalid verificationStatus");
      err.statusCode = 400;
      throw err;
    }
    user.verificationStatus = patch.verificationStatus;
  }

  if (patch.password) {
    user.passwordHash = await bcrypt.hash(patch.password, SALT_ROUNDS);
  }

  await user.save();
  return user;
}

export async function deleteUserByAdmin(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  await User.deleteOne({ _id: userId });
  return true;
}
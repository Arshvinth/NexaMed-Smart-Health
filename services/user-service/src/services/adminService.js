import User from "../models/User.js";

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
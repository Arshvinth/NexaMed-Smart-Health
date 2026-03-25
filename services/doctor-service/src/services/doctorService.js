import Doctor from "../models/Doctor.js";

export async function getMyDoctorProfile(userId) {
  return Doctor.findOne({ userId });
}

/**
 * Upsert doctor profile for logged-in doctor.
 * - If record exists, update it
 * - If not, create it
**/

export async function upsertMyDoctorProfile(userId, payload, verificationStatusFromAuth) {
  const update = { ...payload };

  // dev-mode convenience: keep stored verificationStatus aligned
  if (verificationStatusFromAuth) {
    update.verificationStatus = verificationStatusFromAuth;
  }

  return Doctor.findOneAndUpdate(
    { userId },
    { $set: update, $setOnInsert: { userId } },
    { new: true, upsert: true }
  );
}

//List doctors visible to patients (VERIFIED only)
export async function listVerifiedDoctors({ specialization, q } = {}) {
  const filter = { verificationStatus: "VERIFIED" };
  if (specialization) filter.specialization = specialization;
  if (q) filter.fullName = { $regex: q, $options: "i" };

  return Doctor.find(filter).sort({ createdAt: -1 });
}

//Get a public doctor profile by MongoDB _id.
export async function getPublicDoctorById(doctorId) {
  return Doctor.findById(doctorId);
}
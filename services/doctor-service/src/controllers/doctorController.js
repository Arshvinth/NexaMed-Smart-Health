import {
  getMyDoctorProfile,
  upsertMyDoctorProfile,
  listVerifiedDoctors,
  getPublicDoctorById,
  createDoctor
} from "../services/doctorService.js";

//GET /api/doctors/me/profile
//Returns the logged-in doctor's profile.
export async function getMe(req, res, next) {
  try {
    const profile = await getMyDoctorProfile(req.user.userId);
    res.json(profile || null);
  } catch (e) {
    next(e);
  }
}
//PUT /api/doctors/me/profile
//Creates or updates the logged-in doctor's profile.
export async function putMe(req, res, next) {
  try {
    const updated = await upsertMyDoctorProfile(
      req.user.userId,
      req.body || {},
      req.user.verificationStatus // dev header
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
}
//GET /api/doctors
//Public listing of verified doctors for patient browsing
export async function listDoctors(req, res, next) {
  try {
    const { specialization, q } = req.query;
    const doctors = await listVerifiedDoctors({ specialization, q });
    res.json(doctors);
  } catch (e) {
    next(e);
  }
}
//GET /api/doctors/:doctorId
//Public doctor profile by MongoDB _id  
export async function getDoctorById(req, res, next) {
  try {
    const doc = await getPublicDoctorById(req.params.doctorId);
    if (!doc) return res.status(404).json({ message: "Doctor not found" });

    if (doc.verificationStatus !== "VERIFIED") {
      // Do not leak non-verified doctor data
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doc);
  } catch (e) {
    next(e);
  }
}


export async function addDoctor(req, res, next) {
  try {
    const doctor = await createDoctor(req.body);
    res.status(201).json(doctor);
  } catch (e) {
    //next(e);
    res.status(500).json({ message: "Failed to create doctor profile", error: e.message });
  }
}
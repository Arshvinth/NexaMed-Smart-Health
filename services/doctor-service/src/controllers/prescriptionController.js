// /Doctors create prescriptions.
// Doctors and Patients can view prescriptions, but only their own.
import {
  createPrescription,
  listPrescriptionsForDoctor,
  listPrescriptionsForPatient,
  getPrescriptionById,
  updatePrescriptionForDoctor,
  deletePrescriptionForDoctor
} from "../services/prescriptionService.js";

// POST /api/prescriptions
//Doctor creates a prescription.
export async function postPrescription(req, res, next) {
  try {
    const created = await createPrescription(req.user.userId, req.body || {});
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

//GET /api/prescriptions
//If DOCTOR: returns prescriptions owned by this doctor
//If PATIENT: returns prescriptions owned by this patient
export async function getPrescriptions(req, res, next) {
  try {
    const { appointmentId, patientUserId } = req.query;

    if (req.user.role === "DOCTOR") {
      const rows = await listPrescriptionsForDoctor(req.user.userId, { appointmentId, patientUserId });
      return res.json(rows);
    }

    if (req.user.role === "PATIENT") {
      const rows = await listPrescriptionsForPatient(req.user.userId, { appointmentId });
      return res.json(rows);
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (e) {
    next(e);
  }
}

// GET /api/prescriptions/:id
// Fetch one prescription by id, with access control.
export async function getPrescription(req, res, next) {
  try {
    const row = await getPrescriptionById(req.params.id);
    if (!row) return res.status(404).json({ message: "Prescription not found" });

    if (req.user.role === "DOCTOR" && row.doctorUserId !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (req.user.role === "PATIENT" && row.patientUserId !== req.user.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(row);
  } catch (e) {
    next(e);
  }
}

// PUT /api/prescriptions/:id
// Doctor updates a prescription they own.
export async function putPrescription(req, res, next) {
  try {
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await updatePrescriptionForDoctor(req.params.id, req.user.userId, req.body || {});
    if (!updated) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
}

// DELETE /api/prescriptions/:id
// Doctor deletes a prescription they own.
export async function deletePrescription(req, res, next) {
  try {
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deleted = await deletePrescriptionForDoctor(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
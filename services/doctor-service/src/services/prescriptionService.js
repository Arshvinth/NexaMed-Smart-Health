import Prescription from "../models/Prescription.js";

//Create a prescription for an appointment.
export async function createPrescription(doctorUserId, payload) {
  const { appointmentId, patientUserId, items, notes } = payload;

  // Validate required fields
  if (!appointmentId) throw new Error("appointmentId is required");
  if (!patientUserId) throw new Error("patientUserId is required");
  if (!Array.isArray(items) || items.length === 0) throw new Error("items must be a non-empty array");

  // Later: validate appointment ownership/status via appointment-service
  return Prescription.create({
    appointmentId,
    doctorUserId,
    patientUserId,
    items,
    notes: notes || ""
  });
}

//List prescriptions for a doctor (optionally filtered by appointment/patient)
export async function listPrescriptionsForDoctor(doctorUserId, { appointmentId, patientUserId } = {}) {
  const filter = { doctorUserId };
  if (appointmentId) filter.appointmentId = appointmentId;
  if (patientUserId) filter.patientUserId = patientUserId;

  return Prescription.find(filter).sort({ createdAt: -1 });
}

//List prescriptions for a patient.
export async function listPrescriptionsForPatient(patientUserId, { appointmentId } = {}) {
  const filter = { patientUserId };
  if (appointmentId) filter.appointmentId = appointmentId;

  return Prescription.find(filter).sort({ createdAt: -1 });
}

//Fetch one prescription by its MongoDB _id.
export async function getPrescriptionById(id) {
  return Prescription.findById(id);
}

//Update a prescription owned by a specific doctor.
export async function updatePrescriptionForDoctor(prescriptionId, doctorUserId, payload) {
  const { items, notes } = payload;

  const prescription = await Prescription.findOne({ _id: prescriptionId, doctorUserId });
  if (!prescription) return null;

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("items must be a non-empty array");
    }
    prescription.items = items;
  }

  if (notes !== undefined) {
    if (typeof notes !== "string") {
      throw new Error("notes must be a string");
    }
    prescription.notes = notes;
  }

  await prescription.save();
  return prescription;
}

//Delete a prescription owned by a specific doctor.
export async function deletePrescriptionForDoctor(prescriptionId, doctorUserId) {
  const deleted = await Prescription.findOneAndDelete({ _id: prescriptionId, doctorUserId });
  return deleted;
}
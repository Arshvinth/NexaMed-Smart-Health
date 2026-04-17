//Exposes endpoints for doctors to manage time slots and for patients to view them.
import {
  createAvailability,
  listMyAvailability,
  listDoctorAvailability,
  deleteAvailability
} from "../services/availabilityService.js";

//POST /api/doctors/me/availability
//Create a new availability slot for logged-in doctor.
export async function postMyAvailability(req, res, next) {
  try {
    const created = await createAvailability(req.user.userId, req.body || {});
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

//GET /api/doctors/me/availability
//List logged-in doctor's availability
export async function getMyAvailability(req, res, next) {
  try {
    const slots = await listMyAvailability(req.user.userId);
    res.json(slots);
  } catch (e) {
    next(e);
  }
}

//GET /api/doctors/:doctorUserId/availability
//Public listing of availability slots for a given doctorUserId.
export async function getDoctorAvailability(req, res, next) {
  try {
    const doctorUserId = req.params.doctorUserId;
    const slots = await listDoctorAvailability(doctorUserId, req.query);
    res.json(slots);
  } catch (e) {
    next(e);
  }
}

//DELETE /api/doctors/me/availability/:availabilityId
//Delete a slot belonging to logged-in doctor.
export async function deleteMyAvailability(req, res, next) {
  try {
    const deleted = await deleteAvailability(req.user.userId, req.params.availabilityId);
    res.json(deleted);
  } catch (e) {
    next(e);
  }
}
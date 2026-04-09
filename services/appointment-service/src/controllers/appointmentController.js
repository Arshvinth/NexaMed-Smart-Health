import axios from "axios";
import {
  getAvailableSlots,
  createAppointment,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getUserAppointments,
  getAppointmentById,
} from "../services/appointmentService.js";
import { emitAppointmentUpdate } from "../services/socketService.js";

async function fetchDoctorAvailability(doctorUserId, date) {
  const doctorServiceUrl =
    process.env.DOCTOR_SERVICE_URL || "http://localhost:5002";
  const response = await axios.get(
    `${doctorServiceUrl}/api/doctors/${doctorUserId}/availability`,
    {
      params: { from: date, to: date },
    },
  );
  return response.data;
}

export async function getSlots(req, res) {
  const { doctorUserId, date } = req.query;
  if (!doctorUserId || !date) {
    return res
      .status(400)
      .json({ message: "doctorUserId and date are required" });
  }
  try {
    const availability = await fetchDoctorAvailability(doctorUserId, date);
    const slots = await getAvailableSlots(
      doctorUserId,
      new Date(date),
      availability,
    );
    res.json(slots);
  } catch (error) {
    console.error("Error fetching doctor availability:", error.message);
    res.status(500).json({ message: "Failed to fetch doctor availability" });
  }
}

export async function postAppointment(req, res) {
  const {
    doctorUserId,
    doctorName,
    doctorSpecialization,
    startTime,
    endTime,
    queueNumber,
  } = req.body;
  const patientUserId = req.user.userId;
  if (!doctorUserId || !startTime || !endTime || !queueNumber) {
    return res
      .status(400)
      .json({ message: "Missing required fields (need queueNumber)" });
  }
  const appointment = await createAppointment({
    patientUserId,
    doctorUserId,
    doctorName,
    doctorSpecialization,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    queueNumber,
  });
  emitAppointmentUpdate(appointment, "appointment_created");
  res.status(201).json(appointment);
}

export async function putConfirmAppointment(req, res) {
  const { id } = req.params;
  const { paymentId, amount } = req.body;
  const appointment = await confirmAppointment(id, paymentId, amount);
  emitAppointmentUpdate(appointment, "appointment_confirmed");
  res.json(appointment);
}

export async function patchCancelAppointment(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.userId;
  const role = req.user.role;
  const appointment = await cancelAppointment(id, userId, role, reason);
  emitAppointmentUpdate(appointment, "appointment_cancelled");
  res.json(appointment);
}

export async function postRescheduleAppointment(req, res) {
  const { id } = req.params;
  const { newStartTime, newEndTime, queueNumber } = req.body; // ✅ get queueNumber
  const userId = req.user.userId;
  const role = req.user.role;

  if (!newStartTime || !newEndTime || queueNumber === undefined) {
    return res.status(400).json({
      message: "Missing required fields: newStartTime, newEndTime, queueNumber",
    });
  }

  const result = await rescheduleAppointment(
    id,
    userId,
    role,
    new Date(newStartTime),
    new Date(newEndTime),
    queueNumber,
  );
  emitAppointmentUpdate(result.newAppointment, "appointment_rescheduled");
  res.json(result);
}

export async function getMyAppointments(req, res) {
  const userId = req.user.userId;
  const role = req.user.role;
  const { status, fromDate, toDate } = req.query;
  const appointments = await getUserAppointments(userId, role, {
    status,
    fromDate,
    toDate,
  });
  res.json(appointments);
}

export async function getAppointment(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;
  const appointment = await getAppointmentById(id, userId, role);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }
  res.json(appointment);
}

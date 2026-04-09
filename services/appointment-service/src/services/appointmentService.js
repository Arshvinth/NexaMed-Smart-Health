import Appointment from "../models/Appointment.js";
import { generateTimeSlots } from "./slotService.js";
import axios from "axios";

export async function getAvailableSlots(doctorUserId, date, availabilitySlots) {
  return generateTimeSlots(doctorUserId, date, availabilitySlots);
}

export async function createAppointment({
  patientUserId,
  doctorUserId,
  doctorName,
  doctorSpecialization,
  startTime,
  endTime,
  queueNumber,
}) {
  const existing = await Appointment.findOne({
    doctorUserId,
    startTime,
    status: { $in: ["pending", "confirmed"] },
  });
  if (existing) {
    const err = new Error("Time slot already booked");
    err.statusCode = 409;
    throw err;
  }

  const appointment = await Appointment.create({
    patientUserId,
    doctorUserId,
    doctorName,
    doctorSpecialization,
    startTime,
    endTime,
    queueNumber,
    status: "pending",
  });
  return appointment;
}

export async function confirmAppointment(appointmentId, paymentId, amount) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }
  if (appointment.status !== "pending") {
    const err = new Error("Appointment cannot be confirmed");
    err.statusCode = 400;
    throw err;
  }

  const telemedicineUrl =
    process.env.TELEMEDICINE_SERVICE_URL || "http://telemedicine-service:5005";
  const sessionRes = await axios.post(`${telemedicineUrl}/api/sessions`, {
    appointmentId: appointment._id,
  });
  const meetingLink = sessionRes.data.data.meetingLink;

  appointment.status = "confirmed";
  appointment.paymentId = paymentId;
  appointment.paymentAmount = amount;
  appointment.meetingLink = meetingLink;
  await appointment.save();
  return appointment;
}

export async function cancelAppointment(
  appointmentId,
  userId,
  role,
  reason = null,
) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }
  if (role === "PATIENT" && appointment.patientUserId !== userId) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }
  if (role === "DOCTOR" && appointment.doctorUserId !== userId) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }
  if (!["pending", "confirmed"].includes(appointment.status)) {
    const err = new Error("Appointment cannot be cancelled");
    err.statusCode = 400;
    throw err;
  }
  appointment.status =
    role === "PATIENT" ? "cancelled_by_patient" : "cancelled_by_doctor";
  appointment.cancellationReason = reason;
  await appointment.save();
  return appointment;
}

export async function completeAppointment(appointmentId, userId, role) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }

  if (role !== "DOCTOR") {
    const err = new Error("Only doctors can mark appointments as completed");
    err.statusCode = 403;
    throw err;
  }

  if (appointment.doctorUserId !== userId) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }

  if (appointment.status !== "confirmed") {
    const err = new Error("Only confirmed appointments can be completed");
    err.statusCode = 400;
    throw err;
  }

  appointment.status = "completed";
  await appointment.save();
  return appointment;
}

export async function rescheduleAppointment(
  oldAppointmentId,
  userId,
  role,
  newStartTime,
  newEndTime,
  queueNumber,
) {
  const oldApp = await Appointment.findById(oldAppointmentId);
  if (!oldApp) {
    const err = new Error("Appointment not found");
    err.statusCode = 404;
    throw err;
  }
  if (role === "PATIENT" && oldApp.patientUserId !== userId) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }
  if (role === "DOCTOR" && oldApp.doctorUserId !== userId) {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }
  if (!["pending", "confirmed"].includes(oldApp.status)) {
    const err = new Error("Cannot reschedule this appointment");
    err.statusCode = 400;
    throw err;
  }

  const existing = await Appointment.findOne({
    doctorUserId: oldApp.doctorUserId,
    startTime: newStartTime,
    status: { $in: ["pending", "confirmed"] },
  });
  if (existing) {
    const err = new Error("New time slot is already booked");
    err.statusCode = 409;
    throw err;
  }

  oldApp.status =
    role === "PATIENT" ? "cancelled_by_patient" : "cancelled_by_doctor";
  oldApp.cancellationReason = "Rescheduled";
  await oldApp.save();

  const newApp = await Appointment.create({
    patientUserId: oldApp.patientUserId,
    doctorUserId: oldApp.doctorUserId,
    doctorName: oldApp.doctorName,
    doctorSpecialization: oldApp.doctorSpecialization,
    startTime: newStartTime,
    endTime: newEndTime,
    queueNumber,
    status: oldApp.status === "confirmed" ? "confirmed" : "pending",
    paymentId: oldApp.paymentId,
    paymentAmount: oldApp.paymentAmount,
    meetingLink: oldApp.meetingLink,
    rescheduleFromId: oldApp._id,
  });
  return { oldAppointment: oldApp, newAppointment: newApp };
}

export async function getUserAppointments(userId, role, filters = {}) {
  const query =
    role === "PATIENT" ? { patientUserId: userId } : { doctorUserId: userId };
  if (filters.status) query.status = filters.status;
  if (filters.fromDate || filters.toDate) {
    query.startTime = {};
    if (filters.fromDate) query.startTime.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.startTime.$lte = new Date(filters.toDate);
  }
  return Appointment.find(query).sort({ startTime: 1 });
}

export async function getAppointmentById(appointmentId, userId, role) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return null;
  if (role === "PATIENT" && appointment.patientUserId !== userId) return null;
  if (role === "DOCTOR" && appointment.doctorUserId !== userId) return null;
  return appointment;
}

import Availability from "../models/Availability.js";

//Check if two time intervals overlap.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

//Create a new availability slot for a doctor
export async function createAvailability(doctorUserId, { startTime, endTime }) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Validate input
  if (isNaN(start)) throw new Error("Invalid startTime");
  if (isNaN(end)) throw new Error("Invalid endTime");
  if (end <= start) throw new Error("endTime must be after startTime");

  // For small scale: fetch all slots and compare - overloap check
  const existing = await Availability.find({ doctorUserId });
  for (const slot of existing) {
    if (overlaps(start, end, slot.startTime, slot.endTime)) {
      const err = new Error("Availability overlaps with an existing slot");
      err.statusCode = 409;
      throw err;
    }
  }

  return Availability.create({ doctorUserId, startTime: start, endTime: end });
}

//Get availability slots for the logged-in doctor.
export async function listMyAvailability(doctorUserId) {
  return Availability.find({ doctorUserId }).sort({ startTime: 1 });
}

//Public/patient listing of a doctor's availability.
export async function listDoctorAvailability(doctorUserId, { from, to } = {}) {
  const filter = { doctorUserId };

  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);
  }

  return Availability.find(filter).sort({ startTime: 1 });
}

//Delete an availability slot (only if it belongs to the logged-in doctor).
export async function deleteAvailability(doctorUserId, availabilityId) {
  const deleted = await Availability.findOneAndDelete({ _id: availabilityId, doctorUserId });
  if (!deleted) {
    const err = new Error("Availability slot not found");
    err.statusCode = 404;
    throw err;
  }
  return deleted;
}
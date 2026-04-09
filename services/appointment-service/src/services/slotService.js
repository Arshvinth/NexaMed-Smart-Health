import Appointment from "../models/Appointment.js";

export async function generateTimeSlots(doctorUserId, date, availabilitySlots) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch booked appointments for the day
  const booked = await Appointment.find({
    doctorUserId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "confirmed"] },
  });
  const bookedSet = new Set(
    booked.map((a) => `${a.startTime.getTime()}-${a.endTime.getTime()}`),
  );

  // Generate slots per availability block, resetting queue number each block
  const allSlots = [];
  for (const slot of availabilitySlots) {
    let current = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const blockSlots = [];

    // Create 15‑min slots within this block
    while (current < end) {
      const slotEnd = new Date(current.getTime() + 15 * 60000);
      if (slotEnd > end) break;
      blockSlots.push({
        startTime: new Date(current),
        endTime: new Date(slotEnd),
      });
      current = slotEnd;
    }

    // Assign queue numbers starting from 1 for this block
    blockSlots.forEach((slotItem, idx) => {
      const key = `${slotItem.startTime.getTime()}-${slotItem.endTime.getTime()}`;
      allSlots.push({
        startTime: slotItem.startTime,
        endTime: slotItem.endTime,
        queueNumber: idx + 1, // resets per block
        available: !bookedSet.has(key),
      });
    });
  }

  // Optional: keep slots sorted chronologically (already in block order)
  allSlots.sort((a, b) => a.startTime - b.startTime);
  return allSlots;
}

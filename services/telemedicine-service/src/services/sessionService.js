/**
 * sessionService
 * Stateless session generation:
 * For a given appointmentId, return a deterministic Jitsi room + meeting link.
 * This allows both doctor and patient to join as long as they share appointmentId.
 */

function normalizeAppointmentId(appointmentId) {
  if (!appointmentId || typeof appointmentId !== "string") return "";
  return appointmentId.trim();
}

/**
 * buildSession
 * Builds a session object from appointmentId.
 */
export function buildSession(appointmentId) {
  const normalized = normalizeAppointmentId(appointmentId);

  if (!normalized) {
    const err = new Error("appointmentId is required");
    err.statusCode = 400;
    throw err;
  }

  // Make a URL-safe room name
  const safe = normalized.replace(/[^a-zA-Z0-9-_]/g, "-");
  const roomName = `nexamed-${safe}`;

  // Jitsi meeting URL (public Jitsi)
  const meetingLink = `https://meet.jit.si/${encodeURIComponent(roomName)}`;

  return {
    appointmentId: normalized,
    roomName,
    meetingLink,
    provider: "jitsi",
  };
}
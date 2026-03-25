/**
 * sessionController
 * Controller layer: request -> validate -> call service -> response.
 */

import { buildSession } from "../services/sessionService.js";

/**
 * POST /api/sessions 
 * Body: { appointmentId }
 * Returns: { appointmentId, roomName, meetingLink }
 */
export async function createSession(req, res) {
  const { appointmentId } = req.body || {};
  const session = buildSession(appointmentId);

  // Stateless mode: "create" just returns the derived link
  return res.status(201).json({
    success: true,
    data: session,
  });
}

/**
 * GET /api/sessions/:appointmentId
 * Returns: { appointmentId, roomName, meetingLink }
 */
export async function getSession(req, res) {
  const { appointmentId } = req.params || {};
  const session = buildSession(appointmentId);

  return res.status(200).json({
    success: true,
    data: session,
  });
}
// ConsultationRoom: view and open consultation sessions (meeting iframe)
import React, { useEffect, useState } from "react";
import { getAuthHeaders } from "../../utils/userAuth";
import { useNavigate, useParams } from "react-router-dom";

// API gateway base URL
const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

// Fetch consultation session details (includes meeting link)
async function fetchConsultationSession(appointmentId) {
  const response = await fetch(
    `${API_GATEWAY_BASE_URL}/api/sessions/${appointmentId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to load consultation session.");
  }

  return response.json();
}

// Component: displays a consultation room and allows selecting appointments
export default function ConsultationRoom() {
  // Route params, navigation and component state
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    let active = true;

    // Load session when `sessionId` changes
    async function load() {
      if (!sessionId) {
        // Nothing selected yet; keep room empty but not in error state.
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchConsultationSession(sessionId);
        if (!active) return;
        setSession(data?.data || null);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Unable to load consultation session.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    // When opened from sidebar without a sessionId, load doctor's confirmed appointments
    // so the doctor can pick one from a dropdown.
    if (sessionId) return; // when launched from "Start consultation" we don't need the list

    let active = true;

    // Load doctor's confirmed appointments when no session selected
    async function loadAppointments() {
      setAppointmentsLoading(true);
      try {
        const res = await fetch(
          `${API_GATEWAY_BASE_URL}/api/appointments/me?status=confirmed`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          },
        );
        if (!res.ok) {
          throw new Error("Failed to load appointments");
        }
        const data = await res.json();
        if (!active) return;
        setAppointments(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!active) return;
        // Keep error subtle; main error UI is for session load.
        console.error("Failed to load doctor appointments", e);
      } finally {
        if (active) setAppointmentsLoading(false);
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, [sessionId]);

  // Load patient profiles for dropdown labels
  useEffect(() => {
    const ids = Array.from(new Set(appointments.map((a) => a.patientUserId).filter(Boolean)));
    const missing = ids.filter((id) => !userProfiles[id]);
    if (missing.length === 0) return;

    Promise.all(
      missing.map((id) =>
        fetch(`${API_GATEWAY_BASE_URL}/api/auth/users/${id}`, { method: "GET", headers: getAuthHeaders() })
          .then((r) => r.text())
          .then((text) => {
            try {
              const data = JSON.parse(text);
              return { id, profile: data?.data ?? data ?? null };
            } catch (_e) {
              return { id, profile: null };
            }
          })
          .catch(() => ({ id, profile: null })),
      ),
    ).then((results) => {
      setUserProfiles((prev) => {
        const updated = { ...prev };
        results.forEach(({ id, profile }) => {
          updated[id] = profile;
        });
        return updated;
      });
    });
  }, [appointments, userProfiles]);

  // Extract meeting link from session data
  const meetingLink = session?.meetingLink || "";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Consultation Room</h1>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {/* Appointment selection dropdown (navigates to session) */}
        {!sessionId ? (
          <div className="mb-4 space-y-2">
            <p className="text-sm text-slate-600">
              Select a confirmed appointment to open its consultation room.
            </p>
            <select
              className="w-full max-w-md rounded-lg border border-slate-300 p-2 text-sm"
              disabled={appointmentsLoading || appointments.length === 0}
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                navigate(`/doctor/consult/${value}`);
              }}
           >
              <option value="" disabled>
                {appointmentsLoading
                  ? "Loading confirmed appointments..."
                  : appointments.length === 0
                    ? "No confirmed appointments available"
                    : "Choose an appointment"}
              </option>
              {appointments.map((appt) => {
                const displayPatientName =
                  appt.patientName ||
                  appt.patientFullName ||
                  appt.patient_user_name ||
                  userProfiles[appt.patientUserId]?.fullName ||
                  appt.patientUserId;

                const queueLabel =
                  typeof appt.queueNumber === "number" || appt.queueNumber
                    ? `${appt.queueNumber}`
                    : "No queue";

                const dateTimeLabel = appt.startTime
                  ? new Date(appt.startTime).toLocaleString()
                  : "No time";

                return (
                  <option key={appt._id} value={appt._id}>
                    {`Queue No: ${queueLabel}  — ${displayPatientName} — Date & Time ${dateTimeLabel} `}
                  </option>
                );
              })}
            </select>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {sessionId
              ? "You are viewing the selected consultation session."
              : "Choose a confirmed appointment above to start a consultation."}
          </p>

          {/* Render meeting iframe when meetingLink is available */}
          {meetingLink ? (
            <button
              type="button"
              onClick={() => window.open(meetingLink, "_blank", "noopener,noreferrer")}
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Open in new tab
            </button>
          ) : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
          {loading ? (
            <div className="flex aspect-video items-center justify-center text-sm text-slate-200">
              Loading consultation room...
            </div>
          ) : meetingLink ? (
            <iframe
              title="Consultation room"
              src={meetingLink}
              className="h-[70vh] w-full"
              allow="camera; microphone; fullscreen; display-capture"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-slate-200">
              Consultation room is unavailable.
            </div>
          )}
        </div>

        {/* Show session metadata (IDs) when a session is selected */}
        {sessionId ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Appointment ID
              </p>
              <p className="font-mono text-sm text-slate-900">
                {sessionId}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Meeting ID
              </p>
              <p className="font-mono text-sm text-slate-900">
                {loading ? "Loading..." : session?.roomName || "Not available"}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

const DEV_AUTH = {
  userId: process.env.REACT_APP_DOCTOR_USER_ID || "doc1",
  role: "DOCTOR",
  verificationStatus:
    process.env.REACT_APP_DOCTOR_VERIFICATION_STATUS || "VERIFIED",
};

const CANCELLABLE_STATUSES = ["pending", "confirmed"];
const COMPLETABLE_STATUSES = ["confirmed"];
const FILTERS = [
  "pending",
  "confirmed",
  "completed",
  "cancelled_by_doctor",
  "cancelled_by_patient",
  "ALL",
];

function getAuthHeaders() {
  const storedUserId = localStorage.getItem("x-user-id");
  const storedRole = localStorage.getItem("x-role");
  const storedVerification = localStorage.getItem("x-verification-status");

  return {
    "Content-Type": "application/json",
    "x-user-id": storedUserId || DEV_AUTH.userId,
    "x-role": storedRole || DEV_AUTH.role,
    "x-verification-status": storedVerification || DEV_AUTH.verificationStatus,
  };
}

function getStatusLabel(status) {
  return status
    ?.split("_")
    ?.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    ?.join(" ");
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString();
}

function statusBadgeClass(status) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "confirmed":
      return "bg-emerald-100 text-emerald-800";
    case "completed":
      return "bg-sky-100 text-sky-800";
    case "cancelled_by_doctor":
    case "cancelled_by_patient":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

async function parseErrorResponse(response) {
  let message = "Request failed";
  try {
    const body = await response.json();
    if (body?.message) message = body.message;
  } catch (_error) {
    // Keep fallback if response body is not JSON.
  }
  return `${response.status}: ${message}`;
}

async function listDoctorAppointments() {
  const response = await fetch(`${API_GATEWAY_BASE_URL}/api/appointments/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function cancelAppointment(appointmentId, reason) {
  const response = await fetch(
    `${API_GATEWAY_BASE_URL}/api/appointments/${appointmentId}/cancel`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: reason.trim() }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

async function completeAppointment(appointmentId) {
  const response = await fetch(
    `${API_GATEWAY_BASE_URL}/api/appointments/${appointmentId}/complete`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export default function AppointmentRequests() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listDoctorAppointments();
      setAppointments(data);
    } catch (e) {
      setError(e?.message || "Unable to load appointment requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visibleRows = useMemo(() => {
    if (activeFilter === "ALL") return appointments;
    return appointments.filter((a) => a.status === activeFilter);
  }, [appointments, activeFilter]);

  async function handleCancel(id) {
    const reason = window.prompt("Reason for cancellation:", "");

    if (reason === null) return;

    if (!reason || reason.trim() === "") {
      setError("Cancellation reason is required.");
      return;
    }

    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      await cancelAppointment(id, reason);
      await load();
      setSuccess("Appointment cancelled.");
    } catch (e) {
      setError(e?.message || "Failed to cancel appointment.");
    } finally {
      setBusyId("");
    }
  }

  async function handleComplete(id) {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      await completeAppointment(id);
      await load();
      setSuccess("Appointment marked as completed.");
    } catch (e) {
      setError(e?.message || "Failed to mark appointment as completed.");
    } finally {
      setBusyId("");
    }
  }

  async function handleStartConsultation(appt) {
    if (appt.status !== "confirmed") {
      setError("Only confirmed appointments can start a consultation.");
      return;
    }

    setBusyId(appt._id);
    setError("");
    setSuccess("");

    try {
      navigate(`/doctor/consult/${appt._id}`);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">Appointment Requests</h1>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                activeFilter === f
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              {f === "ALL" ? "ALL" : getStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <p className="text-sm text-slate-600">Loading appointments...</p>
        ) : visibleRows.length === 0 ? (
          <p className="text-sm text-slate-600">No appointments found for this filter.</p>
        ) : (
          <div className="space-y-3">
            {visibleRows.map((appt) => {
              const cancellable = CANCELLABLE_STATUSES.includes(appt.status);
              const completable = COMPLETABLE_STATUSES.includes(appt.status);
              const isBusy = busyId === appt._id;
              const canStartConsultation = appt.status === "confirmed";
              const canIssuePrescription =
                appt.status === "confirmed" || appt.status === "completed";

              return (
                <div key={appt._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold text-slate-900">Appointment:</span>{" "}
                        {appt._id}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Patient ID:</span>{" "}
                        {appt.patientUserId}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Start:</span>{" "}
                        {formatDateTime(appt.startTime)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">End:</span>{" "}
                        {formatDateTime(appt.endTime)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Queue #:</span>{" "}
                        {appt.queueNumber ?? "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Amount:</span>{" "}
                        {typeof appt.paymentAmount === "number"
                          ? `LKR ${appt.paymentAmount}`
                          : "N/A"}
                      </p>
                      {appt.cancellationReason ? (
                        <p>
                          <span className="font-semibold text-slate-900">
                            Cancellation Reason:
                          </span>{" "}
                          {appt.cancellationReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                          statusBadgeClass(appt.status),
                        ].join(" ")}
                      >
                        {getStatusLabel(appt.status)}
                      </span>

                      {canStartConsultation ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStartConsultation(appt)}
                          className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                        >
                          {isBusy ? "Please wait..." : "Start consultation"}
                        </button>
                      ) : null}
                      {canIssuePrescription ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            navigate(`/doctor/prescriptions/${appt._id}`)
                          }
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          Issue prescription
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {cancellable || completable ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cancellable ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCancel(appt._id)}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {isBusy ? "Please wait..." : "Cancel Appointment"}
                        </button>
                      ) : null}

                      {completable ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleComplete(appt._id)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {isBusy ? "Please wait..." : "Mark Completed"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

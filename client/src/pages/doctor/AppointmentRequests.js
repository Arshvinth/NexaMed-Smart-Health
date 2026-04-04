import React, { useEffect, useMemo, useState } from "react";

/**
 * Temporary local data adapter.
 * Later, replace only these functions with fetch calls to appointment-service.
 */
const STORAGE_KEY = "doctor_appointments_v1";

const DEV_DOCTOR_ID =
  process.env.REACT_APP_DOCTOR_USER_ID || localStorage.getItem("x-user-id") || "doc1";

/**
 * Doctor can only CANCEL appointments with a reason.
 * - PENDING_PAYMENT = pending request awaiting doctor decision
 * - CANCELLED + cancelledBy=DOCTOR = cancelled by doctor
 */
const ACTIONABLE_STATUSES = ["PENDING_PAYMENT"];
const FILTERS = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED", "ALL"];

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleString();
}

function statusBadgeClass(status) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-amber-100 text-amber-800";
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800";
    case "COMPLETED":
      return "bg-sky-100 text-sky-800";
    case "CANCELLED":
    case "AUTO_CANCELLED":
    case "NO_SHOW":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(rows) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function seedIfEmpty(doctorId) {
  const existing = readStore();
  if (existing.length > 0) return;

  const now = Date.now();
  const seeded = [
    {
      _id: "apt-001",
      patientId: "pat-001",
      doctorId,
      startTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      paymentId: null,
      amount: 3500,
      currency: "LKR",
      meetingId: "",
      meetingLink: "",
      meetingStatus: "NOT_CREATED",
      cancelledBy: null,
      cancellationReason: "",
      cancelledAt: null,
      consultationNotes: "",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      _id: "apt-002",
      patientId: "pat-002",
      doctorId,
      startTime: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now + 48 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentId: "pay-1002",
      amount: 4500,
      currency: "LKR",
      meetingId: "meet-apt-002",
      meetingLink: "https://meet.jit.si/nexamed-apt-002",
      meetingStatus: "CREATED",
      cancelledBy: null,
      cancellationReason: "",
      cancelledAt: null,
      consultationNotes: "",
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  writeStore(seeded);
}

async function listDoctorAppointments(doctorId) {
  const rows = readStore().filter((r) => r.doctorId === doctorId);
  rows.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return rows;
}

async function patchAppointment(appointmentId, patch) {
  const rows = readStore();
  const idx = rows.findIndex((r) => r._id === appointmentId);
  if (idx < 0) {
    throw new Error("Appointment not found");
  }

  const next = {
    ...rows[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  rows[idx] = next;
  writeStore(rows);
  return next;
}

async function rejectAppointment(appointmentId, reason) {
  if (!reason || reason.trim() === "") {
    throw new Error("Cancellation reason is required.");
  }

  return patchAppointment(appointmentId, {
    status: "CANCELLED",
    cancelledBy: "DOCTOR",
    cancellationReason: reason.trim(),
    cancelledAt: new Date().toISOString(),
  });
}

export default function AppointmentRequests() {
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("PENDING_PAYMENT");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      seedIfEmpty(DEV_DOCTOR_ID);
      const data = await listDoctorAppointments(DEV_DOCTOR_ID);
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

  async function handleReject(id) {
    const reason = window.prompt("Reason for cancellation:", "");
    
    if (reason === null) {
      return; // User cancelled the prompt
    }

    if (!reason || reason.trim() === "") {
      setError("Cancellation reason is required.");
      return;
    }

    setBusyId(id);
    setError("");
    setSuccess("");
    try {
      await rejectAppointment(id, reason);
      await load();
      setSuccess("Appointment cancelled.");
    } catch (e) {
      setError(e?.message || "Failed to cancel appointment.");
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
              {f}
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
              const actionable = ACTIONABLE_STATUSES.includes(appt.status);
              const isBusy = busyId === appt._id;

              return (
                <div
                  key={appt._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold text-slate-900">Appointment:</span> {appt._id}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Patient ID:</span> {appt.patientId}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Start:</span> {formatDateTime(appt.startTime)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">End:</span> {formatDateTime(appt.endTime)}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Amount:</span> {appt.amount} {appt.currency}
                      </p>
                      {appt.cancellationReason ? (
                        <p>
                          <span className="font-semibold text-slate-900">Cancellation Reason:</span>{" "}
                          {appt.cancellationReason}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                        statusBadgeClass(appt.status),
                      ].join(" ")}
                    >
                      {appt.status}
                    </span>
                  </div>

                  {actionable ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReject(appt._id)}
                        className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {isBusy ? "Please wait..." : "Cancel Appointment"}
                      </button>
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
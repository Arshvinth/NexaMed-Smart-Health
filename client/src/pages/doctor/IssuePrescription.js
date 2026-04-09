import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

const DEV_AUTH = {
  userId: process.env.REACT_APP_DOCTOR_USER_ID || "doc1",
  role: "DOCTOR",
  verificationStatus:
    process.env.REACT_APP_DOCTOR_VERIFICATION_STATUS || "VERIFIED",
};

function getAuthHeaders() {
  const storedUserId = localStorage.getItem("x-user-id");
  const storedRole = localStorage.getItem("x-role");
  const storedVerification = localStorage.getItem("x-verification-status");

  return {
    "Content-Type": "application/json",
    "x-user-id": storedUserId || DEV_AUTH.userId,
    "x-role": storedRole || DEV_AUTH.role,
    "x-verification-status":
      storedVerification || DEV_AUTH.verificationStatus,
  };
}

async function fetchAppointment(appointmentId) {
  const response = await fetch(
    `${API_GATEWAY_BASE_URL}/api/appointments/${appointmentId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to load appointment details.");
  }

  return response.json();
}

async function createPrescription(payload) {
  const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prescriptions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to create prescription.");
  }

  return response.json();
}

export default function IssuePrescription() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { medicineName: "", dosage: "", frequency: "", durationDays: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await fetchAppointment(appointmentId);
        if (!active) return;
        setAppointment(data);
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Unable to load appointment.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [appointmentId]);

  useEffect(() => {
    // When opened from sidebar without an appointmentId, let the doctor
    // pick one of their confirmed/completed appointments to issue a prescription for.
    if (appointmentId) return;

    let active = true;

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
        console.error("Failed to load doctor appointments", e);
      } finally {
        if (active) setAppointmentsLoading(false);
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, [appointmentId]);

  function updateItem(index, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { medicineName: "", dosage: "", frequency: "", durationDays: "" },
    ]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!appointmentId || !appointment?.patientUserId) {
      setError("Missing appointment or patient information.");
      return;
    }

    const cleanedItems = items
      .map((it) => ({
        ...it,
        durationDays: Number(it.durationDays || 0),
      }))
      .filter(
        (it) =>
          it.medicineName &&
          it.dosage &&
          it.frequency &&
          Number.isFinite(it.durationDays) &&
          it.durationDays > 0,
      );

    if (cleanedItems.length === 0) {
      setError("Please add at least one valid medicine.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createPrescription({
        appointmentId,
        patientUserId: appointment.patientUserId,
        notes,
        items: cleanedItems,
      });
      setSuccess("Prescription created successfully.");
    } catch (e) {
      setError(e?.message || "Failed to create prescription.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Issue Prescription</h1>

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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        {!appointmentId ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Select an appointment to issue a prescription for.
            </p>
            <select
              className="w-full max-w-md rounded-lg border border-slate-300 p-2 text-sm"
              disabled={appointmentsLoading || appointments.length === 0}
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                navigate(`/doctor/prescriptions/${value}`);
              }}
            >
              <option value="" disabled>
                {appointmentsLoading
                  ? "Loading confirmed appointments..."
                  : appointments.length === 0
                    ? "No confirmed appointments available"
                    : "Choose an appointment"}
              </option>
              {appointments.map((appt) => (
                <option key={appt._id} value={appt._id}>
                  {`${appt._id} 
                  | Patient: ${appt.patientUserId} 
                  | ${new Date(appt.startTime).toLocaleString()}`}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <p className="text-slate-600">
          Appointment:{" "}
          <span className="font-semibold">{appointmentId || "(select one)"}</span>
        </p>
        <p className="text-slate-600">
          Patient ID:{" "}
          <span className="font-semibold">
            {appointment?.patientUserId || (loading ? "Loading..." : "(unknown)")}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Notes (optional)
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                Medicines
              </span>
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200"
              >
                Add medicine
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <input
                    type="text"
                    placeholder="Medicine name"
                    className="min-w-[150px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                    value={item.medicineName}
                    onChange={(e) =>
                      updateItem(index, "medicineName", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    className="min-w-[120px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                    value={item.dosage}
                    onChange={(e) => updateItem(index, "dosage", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. 2x daily)"
                    className="min-w-[140px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                    value={item.frequency}
                    onChange={(e) =>
                      updateItem(index, "frequency", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Days"
                    className="w-24 rounded-lg border border-slate-300 p-2 text-sm"
                    value={item.durationDays}
                    onChange={(e) =>
                      updateItem(index, "durationDays", e.target.value)
                    }
                  />
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Prescription"}
          </button>
        </form>
      </div>
    </div>
  );
}
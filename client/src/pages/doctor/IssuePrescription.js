import React, { useEffect, useState } from "react";
import { getAuthHeaders } from "../../utils/userAuth";
import { useNavigate, useParams } from "react-router-dom";
// Page: IssuePrescription — issue and submit e-prescriptions for appointments

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

// Frequency options for medicines
const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 6 hours",
  "Every 8 hours",
  "At bedtime",
  "As needed",
];

// Common dosage suggestions for quick entry
const DOSAGE_SUGGESTIONS = [
  "100mg",
  "250mg",
  "500mg",
  "1g",
  "2.5ml",
  "5ml",
  "10ml",
];

// Popular medicine suggestions for autocompletion
const MEDICINE_SUGGESTIONS = [
  "Paracetamol",
  "Ibuprofen",
  "Amoxicillin",
  "Ceftriaxone",
  "Azithromycin",
  "Metformin",
  "Amlodipine",
  "Atorvastatin",
  "Omeprazole",
  "Losartan",
];

// Helper: fetch appointment details by id
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

// Helper: send prescription payload to backend
async function createPrescription(payload) {

  console.log("Creating prescription with payload:", payload);
  const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prescriptions/`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to create prescription.");
  }

  return response.json();
}

// Helper: fetch a user profile from user-service (may be wrapped in `data`)
async function fetchUserProfile(userId) {
  const url = `${API_GATEWAY_BASE_URL}/api/auth/users/${userId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return data?.data ?? data ?? {};
}

// Component state: appointment, form fields, loading and helper data
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

  // Optional: loaded patient profile when appointment lacks name fields
  const [patientProfile, setPatientProfile] = useState(null);

  // Cache of user profiles for appointments dropdown
  const [userProfiles, setUserProfiles] = useState({});

  // Appointments list and loading state for selection when no appointmentId
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [itemErrors, setItemErrors] = useState([]);

  // Load appointment details when `appointmentId` is provided
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

  // Fetch patient profile if appointment loads without a patient name
  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!appointment?.patientUserId) return;
      // If appointment already contains a name, prefer that
      if (appointment.patientName || appointment.patientFullName || appointment.patient_user_name) {
        setPatientProfile(null);
        return;
      }
      try {
        const profile = await fetchUserProfile(appointment.patientUserId);
        if (!active) return;
        setPatientProfile(profile || null);
      } catch (e) {
        if (!active) return;
        setPatientProfile(null);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [appointment]);

  // If no `appointmentId`, load confirmed appointments so doctor can pick one
  useEffect(() => {
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

  // Prefetch missing user profiles for the appointments dropdown
  useEffect(() => {
    const ids = Array.from(new Set(appointments.map((a) => a.patientUserId).filter(Boolean)));
    const missing = ids.filter((id) => !userProfiles[id]);
    if (missing.length === 0) return;

    Promise.all(
      missing.map((id) =>
        fetchUserProfile(id)
          .then((profile) => ({ id, profile }))
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

  // Form helpers: update a medicine row's field
  function updateItem(index, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    setItemErrors((prev) => {
      if (!prev || !prev.length) return prev;
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: "" };
      }
      return next;
    });
  }

  // Form helpers: append a new medicine row
  function addItem() {
    setItems((prev) => [
      ...prev,
      { medicineName: "", dosage: "", frequency: "", durationDays: "" },
    ]);
  }

  // Form helpers: remove a medicine row by index
  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Submit handler: validate form and post prescription to API
  async function handleSubmit(e) {
    e.preventDefault();
    if (!appointmentId || !appointment?.patientUserId) {
      setError("Missing appointment or patient information.");
      return;
    }

    const nextErrors = items.map(() => ({
      medicineName: "",
      dosage: "",
      frequency: "",
      durationDays: "",
    }));

    const cleanedItems = [];

    items.forEach((rawItem, index) => {
      const medicineName = (rawItem.medicineName || "").trim();
      const dosage = (rawItem.dosage || "").trim();
      const frequency = (rawItem.frequency || "").trim();
      const durationDaysNum = Number(rawItem.durationDays || 0);

      const hasAnyValue =
        medicineName || dosage || frequency || rawItem.durationDays;

      if (!hasAnyValue) {
        // Completely empty row: ignore it.
        return;
      }

      if (!medicineName) {
        nextErrors[index].medicineName = "Medicine name is required.";
      }
      if (!dosage) {
        nextErrors[index].dosage = "Dosage is required.";
      }
      if (!frequency) {
        nextErrors[index].frequency = "Frequency is required.";
      }
      if (!Number.isFinite(durationDaysNum) || durationDaysNum <= 0) {
        nextErrors[index].durationDays = "Enter days (must be \\u2265 1).";
      }

      const hasErrorForRow = Object.values(nextErrors[index]).some(Boolean);

      if (!hasErrorForRow) {
        cleanedItems.push({
          medicineName,
          dosage,
          frequency,
          durationDays: durationDaysNum,
        });
      }
    });

    setItemErrors(nextErrors);

    if (cleanedItems.length === 0) {
      setError("Please add at least one valid medicine.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setItemErrors([]);

    try {
      console.log("Appointment ID:", appointmentId);
      await createPrescription({
        appointmentId: appointmentId,
        patientUserId: appointment.patientUserId,
        notes: notes.trim(),
        items: cleanedItems,
      });
      setSuccess("Prescription created successfully.");
    } catch (e) {
      setError(e?.message || "Failed to create prescription.");
    } finally {
      setSaving(false);
    }
  }

  // Compute display name for selected patient
  const selectedPatientName =
    appointment?.patientName ||
    appointment?.patientFullName ||
    appointment?.patient_user_name ||
    patientProfile?.fullName ||
    appointment?.patientUserId ||
    "";

  // Render page UI: alerts, appointment selector, and prescription form
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
              aria-label="Select appointment"
              className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 bg-white shadow-sm"
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

        {appointmentId && appointment ? (
          <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selected appointment
            </p>
            <p>
              <span className="font-semibold text-slate-900">Patient Name:</span>{" "}
              {selectedPatientName || appointment.patientUserId || "(unknown)"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Date &amp; time:</span>{" "}
              {appointment.startTime
                ? new Date(appointment.startTime).toLocaleString()
                : "(not set)"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Queue No:</span>{" "}
              {appointment.queueNumber ?? "N/A"}
            </p>
            <div className="flex justify-end mt-2">
              <div className="text-xs text-slate-500 mr-2">Patient ID</div>
              <div className="font-mono text-xs text-slate-700">{appointment.patientUserId || (loading ? "Loading..." : "(unknown)")}</div>
            </div>
          </div>
        ) : (
          <p className="text-slate-600">
            Appointment:{" "}
            <span className="font-semibold">(select one)</span>
          </p>
        )}

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

            {itemErrors.some((row) => row && Object.values(row).some(Boolean)) ? (
              <p className="text-xs text-rose-600">
                Please complete all fields for each medicine you want to add.
              </p>
            ) : null}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <input
                    type="text"
                    placeholder="Medicine name"
                    list="medicine-options"
                    className="min-w-[150px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                    value={item.medicineName}
                    onChange={(e) =>
                      updateItem(index, "medicineName", e.target.value)
                    }
                  />
                  {itemErrors[index]?.medicineName ? (
                    <p className="basis-full text-xs text-rose-600">
                      {itemErrors[index].medicineName}
                    </p>
                  ) : null}
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    list="dosage-options"
                    className="min-w-[120px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                    value={item.dosage}
                    onChange={(e) => updateItem(index, "dosage", e.target.value)}
                  />
                  {itemErrors[index]?.dosage ? (
                    <p className="basis-full text-xs text-rose-600">
                      {itemErrors[index].dosage}
                    </p>
                  ) : null}
                  <select
                    className="min-w-[160px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                    value={item.frequency}
                    onChange={(e) =>
                      updateItem(index, "frequency", e.target.value)
                    }
                  >
                    <option value="">Select frequency</option>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {itemErrors[index]?.frequency ? (
                    <p className="basis-full text-xs text-rose-600">
                      {itemErrors[index].frequency}
                    </p>
                  ) : null}
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
                  {itemErrors[index]?.durationDays ? (
                    <p className="basis-full text-xs text-rose-600">
                      {itemErrors[index].durationDays}
                    </p>
                  ) : null}
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
            {/* Datalists for dosage and medicine suggestions */}
            <datalist id="dosage-options">
              {DOSAGE_SUGGESTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
            <datalist id="medicine-options">
              {MEDICINE_SUGGESTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
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
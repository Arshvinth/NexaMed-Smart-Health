import React, { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../../utils/userAuth";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";


// Frequency options for medicine dosing
const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 6 hours",
  "Every 8 hours",
  "At bedtime",
  "As needed",
];

// Common dosage suggestions for datalist
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

// fetch prescriptions issued by the logged-in doctor
async function fetchMyPrescriptions() {
  const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prescriptions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to load prescriptions.");
  }

  return response.json();
}

// Helper: update an existing prescription
async function updatePrescription(id, payload) {
  const response = await fetch(
    `${API_GATEWAY_BASE_URL}/api/prescriptions/${id}`,
    {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to update prescription.");
  }

  return response.json();
}

// Helper: delete a prescription by id
async function deletePrescription(id) {
  const response = await fetch(
    `${API_GATEWAY_BASE_URL}/api/prescriptions/${id}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to delete prescription.");
  }
}

// Helper: parse common error response payloads
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

// Helper: list appointments for the logged-in doctor
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

// Component: DoctorPrescriptions — state, data loaders, and handlers
export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formItemErrors, setFormItemErrors] = useState([]);

  // Appointment list and cached user profiles for display
  const [appointments, setAppointments] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [search, setSearch] = useState("");

  // Load doctor's appointments for contextual data (queue numbers etc.)
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


  // Load prescriptions for this doctor on mount
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchMyPrescriptions();
        if (!active) return;
        setPrescriptions(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Unable to load prescriptions.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  // Prefetch missing user profiles referenced by prescriptions for display
  useEffect(() => {
    const ids = Array.from(new Set(prescriptions.map((p) => p.patientUserId).filter(Boolean)));
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
  }, [prescriptions, userProfiles]);

  // Open edit modal and populate form with prescription data
  function openEdit(p) {
    setEditingPrescription(p);
    setFormNotes(p.notes || "");
    const initialItems =
      Array.isArray(p.items) && p.items.length > 0
        ? p.items.map((it) => ({ ...it, durationDays: String(it.durationDays || "") }))
        : [
          {
            medicineName: "",
            dosage: "",
            frequency: "",
            durationDays: "",
          },
        ];

    setFormItems(initialItems);
    setFormItemErrors(
      initialItems.map(() => ({
        medicineName: "",
        dosage: "",
        frequency: "",
        durationDays: "",
      })),
    );
    setEditing(true);
  }

  // Close edit modal and reset form state
  function closeEdit() {
    setEditing(false);
    setEditingPrescription(null);
    setFormNotes("");
    setFormItems([]);
    setSavingEdit(false);
    setFormItemErrors([]);
  }

  // Form helper: update field for a specific form item
  function updateFormItem(index, field, value) {
    setFormItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    setFormItemErrors((prev) => {
      if (!prev || !prev.length) return prev;
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: "" };
      }
      return next;
    });
  }

  // Form helper: append a new medicine row
  function addFormItem() {
    setFormItems((prev) => [
      ...prev,
      { medicineName: "", dosage: "", frequency: "", durationDays: "" },
    ]);
    setFormItemErrors((prev) => [
      ...prev,
      { medicineName: "", dosage: "", frequency: "", durationDays: "" },
    ]);
  }

  // remove medicine row at index
  function removeFormItem(index) {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
    setFormItemErrors((prev) => prev.filter((_, i) => i !== index));
  }

  // validate and submit edited prescription to server
  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingPrescription) return;

    const nextErrors = formItems.map(() => ({
      medicineName: "",
      dosage: "",
      frequency: "",
      durationDays: "",
    }));

    const cleanedItems = [];
    let hasAnyError = false;

    formItems.forEach((rawItem, index) => {
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
        nextErrors[index].durationDays = "Enter days (must be > 1).";
      }

      const hasErrorForRow = Object.values(nextErrors[index]).some(Boolean);

      if (!hasErrorForRow) {
        cleanedItems.push({
          medicineName,
          dosage,
          frequency,
          durationDays: durationDaysNum,
        });
      } else {
        hasAnyError = true;
      }
    });

    setFormItemErrors(nextErrors);

    if (hasAnyError) {
      setError("Please fix the highlighted medicine fields before saving.");
      return;
    }

    if (cleanedItems.length === 0) {
      setError("Please add at least one valid medicine for the update.");
      return;
    }

    setSavingEdit(true);
    setError("");

    try {
      const updated = await updatePrescription(editingPrescription._id, {
        notes: formNotes,
        items: cleanedItems,
      });

      setPrescriptions((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p)),
      );
      closeEdit();
    } catch (e) {
      setError(e?.message || "Failed to update prescription.");
      setSavingEdit(false);
    }
  }

  // Handler: delete a prescription after user confirmation
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this prescription?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      await deletePrescription(id);
      setPrescriptions((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      setError(e?.message || "Failed to delete prescription.");
    } finally {
      setDeletingId(null);
    }
  }

  // Memo: map appointmentId -> appointment details for quick lookup
  const appointmentDetails = React.useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (a && a._id) map[a._id] = a;
    });
    return map;
  }, [appointments]);

  // Memo: filter prescriptions by search term (patient name or queue number)
  const filteredPrescriptions = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return prescriptions;

    return prescriptions.filter((p) => {
      const displayPatientName =
        (p.patientName || p.patientFullName || p.patient_user_name || userProfiles[p.patientUserId]?.fullName || "").toLowerCase();

      if (displayPatientName.includes(q)) return true;

      const appointment = appointmentDetails[p.appointmentId];
      const queueLabel = appointment?.queueNumber != null ? String(appointment.queueNumber) : "";
      if (queueLabel.includes(q)) return true;

      return false;
    });
  }, [prescriptions, userProfiles, appointmentDetails, search]);

  // Render: header, search, list of prescriptions, and edit modal
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            My Patients' Prescriptions
          </h1>
          <p className="text-sm text-slate-500">
            Review, update, or remove prescriptions you have issued.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            aria-label="Search prescriptions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or queue number"
            className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Prescription List View Section - styled container */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8 space-y-6 shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center min-h-[120px]">
            <span className="text-base text-slate-600 animate-pulse">Loading prescriptions...</span>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-slate-500">
            <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h2a4 4 0 014 4v2M9 17a4 4 0 01-4-4V7a4 4 0 014-4h6a4 4 0 014 4v6a4 4 0 01-4 4M9 17h6" />
            </svg>
            <p className="font-semibold text-lg">No prescriptions found</p>
            <p className="max-w-md text-sm">
              Once you issue prescriptions for your patients, they will appear here for quick review and updates.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map through filtered prescriptions returned from doctor-service */}
              {filteredPrescriptions.map((p) => {
              // Derive a readable patient label; fall back to patientUserId
                const displayPatientName =
                  p.patientName ||
                  p.patientFullName ||
                  p.patient_user_name ||
                  userProfiles[p.patientUserId]?.fullName ||
                  p.patientUserId;

              // Get appointment details if available
              const appointment = appointmentDetails[p.appointmentId];
              const queueLabel =
                typeof appointment?.queueNumber === "number"
                  ? `${appointment.queueNumber}`
                  : "N/A";
              const appointmentDateTime =
                appointment?.startTime || appointment?.appointmentTime;
              const appointmentDateTimeLabel = appointmentDateTime
                ? new Date(appointmentDateTime).toLocaleString()
                : "N/A";

              return (
                <div
                  key={p._id}
                  className="w-full relative rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-md hover:shadow-xl transition-shadow duration-200 group"
                >
                  {/* Patient and appointment info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                          <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Patient
                          </span>
                          {displayPatientName}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-1">
                        <span>
                          {/* Queue number from appointment (usually N/A until backend sends it) */}
                          <span className="font-semibold text-slate-700">Queue No:</span> {queueLabel}
                        </span>
                        <span>
                          {/* When appointment time is not enriched, this shows prescription creation time */}
                          <span className="font-semibold text-slate-700">Appointment Date and time:</span> {appointmentDateTimeLabel}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 text-right">
                      Issued At: <span className="font-medium text-slate-700">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}
                      </span>
                    </span>
                  </div>

                  {/* Notes section, if present */}
                  {p.notes ? (
                    <div className="rounded-lg bg-amber-50/80 border border-amber-100 p-3 text-sm text-slate-800 shadow-inner">
                      <span className="font-semibold text-amber-900">Notes:</span> {p.notes}
                    </div>
                  ) : null}

                  {/* Medicines list section */}
                  {Array.isArray(p.items) && p.items.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                        Medicines
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {/* Render each medicine item */}
                        {p.items.map((item, index) => (
                          <li
                            key={index}
                            className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 shadow-sm border border-slate-200"
                          >
                            <span className="font-semibold text-emerald-800">
                              {item.medicineName}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-slate-700">{item.dosage}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-slate-700">{item.frequency}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-slate-700">{item.durationDays} days</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Action buttons (Update/Delete) */}
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      className="rounded-lg bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-200 disabled:opacity-60 transition-colors"
                    >
                      {deletingId === p._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal rendered when editing state is active */}
      {editing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Update Prescription
              </h2>
              <button
                type="button"
                onClick={closeEdit}
                className="text-sm text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {editingPrescription ? (
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold">{userProfiles[editingPrescription.patientUserId]?.fullName || editingPrescription.patientUserId}</span>{" "}
                | Appointment: <span className="font-semibold">{editingPrescription.appointmentId}</span>
              </p>
            ) : null}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800">
                  Notes
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    Medicines
                  </span>
                  <button
                    type="button"
                    onClick={addFormItem}
                    className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    Add medicine
                  </button>
                </div>
                {formItemErrors.some((row) => row && Object.values(row).some(Boolean)) ? (
                  <p className="text-xs text-rose-600">
                    Please complete all fields for each medicine you want to update.
                  </p>
                ) : null}

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {formItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-3"
                    >
                      <input
                        type="text"
                        placeholder="Medicine name"
                        list="edit-medicine-options"
                        className="min-w-[150px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                        value={item.medicineName}
                        onChange={(e) =>
                          updateFormItem(index, "medicineName", e.target.value)
                        }
                      />
                      {formItemErrors[index]?.medicineName ? (
                        <p className="basis-full text-xs text-rose-600">
                          {formItemErrors[index].medicineName}
                        </p>
                      ) : null}
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        list="edit-dosage-options"
                        className="min-w-[120px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                        value={item.dosage}
                        onChange={(e) =>
                          updateFormItem(index, "dosage", e.target.value)
                        }
                      />
                      {formItemErrors[index]?.dosage ? (
                        <p className="basis-full text-xs text-rose-600">
                          {formItemErrors[index].dosage}
                        </p>
                      ) : null}
                      <select
                        className="min-w-[160px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                        value={item.frequency}
                        onChange={(e) =>
                          updateFormItem(index, "frequency", e.target.value)
                        }
                      >
                        <option value="">Select frequency</option>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {formItemErrors[index]?.frequency ? (
                        <p className="basis-full text-xs text-rose-600">
                          {formItemErrors[index].frequency}
                        </p>
                      ) : null}
                      <input
                        type="number"
                        min="1"
                        placeholder="Days"
                        className="w-24 rounded-lg border border-slate-300 p-2 text-sm"
                        value={item.durationDays}
                        onChange={(e) =>
                          updateFormItem(index, "durationDays", e.target.value)
                        }
                      />
                      {formItemErrors[index]?.durationDays ? (
                        <p className="basis-full text-xs text-rose-600">
                          {formItemErrors[index].durationDays}
                        </p>
                      ) : null}
                      {formItems.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeFormItem(index)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                <datalist id="edit-dosage-options">
                  {DOSAGE_SUGGESTIONS.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
                <datalist id="edit-medicine-options">
                  {MEDICINE_SUGGESTIONS.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


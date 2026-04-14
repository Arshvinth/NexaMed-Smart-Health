import React, { useEffect, useState } from "react";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

const DEV_AUTH = {
  userId: process.env.REACT_APP_DOCTOR_USER_ID || "doc1",
  role: "DOCTOR",
  verificationStatus:
    process.env.REACT_APP_DOCTOR_VERIFICATION_STATUS || "VERIFIED",
};

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 6 hours",
  "Every 8 hours",
  "At bedtime",
  "As needed",
];

const DOSAGE_SUGGESTIONS = [
  "100mg",
  "250mg",
  "500mg",
  "1g",
  "2.5ml",
  "5ml",
  "10ml",
];

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

async function updatePrescription(id, payload) {
  const response = await fetch(
    `${API_GATEWAY_BASE_URL}/api/prescriptions/${id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Failed to update prescription.");
  }

  return response.json();
}

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

  function closeEdit() {
    setEditing(false);
    setEditingPrescription(null);
    setFormNotes("");
    setFormItems([]);
    setSavingEdit(false);
    setFormItemErrors([]);
  }

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

  function removeFormItem(index) {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
    setFormItemErrors((prev) => prev.filter((_, i) => i !== index));
  }

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
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-600">Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-slate-500">
            <p className="font-medium">No prescriptions found.</p>
            <p className="max-w-md">
              Once you issue prescriptions for your patients, they will appear here
              for quick review and updates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((p) => {
              const displayPatientName =
                p.patientName ||
                p.patientFullName ||
                p.patient_user_name ||
                p.patientUserId;

              const queueLabel =
                typeof p.queueNumber === "number" || p.queueNumber
                  ? `#${p.queueNumber}`
                  : "N/A";

              const appointmentDateTime =
                p.appointmentStartTime ||
                p.startTime ||
                p.appointmentTime ||
                p.createdAt;

              const appointmentDateTimeLabel = appointmentDateTime
                ? new Date(appointmentDateTime).toLocaleString()
                : "N/A";

              return (
                <div
                  key={p._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Patient
                          </span>
                          {displayPatientName}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-sky-600">
                            Appointment
                          </span>
                          {p.appointmentId}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                        <span>
                          <span className="font-semibold text-slate-700">Queue #:</span>{" "}
                          {queueLabel}
                        </span>
                        <span>
                          <span className="font-semibold text-slate-700">Date &amp; time:</span>{" "}
                          {appointmentDateTimeLabel}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 text-right">
                      Created:{" "}
                      <span className="font-medium text-slate-700">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleString()
                          : "N/A"}
                      </span>
                    </span>
                  </div>

                {p.notes ? (
                  <p className="rounded-lg bg-white/60 p-3 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Notes:</span>{" "}
                    {p.notes}
                  </p>
                ) : null}

                {Array.isArray(p.items) && p.items.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Medicines
                    </p>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {p.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 px-2 py-1"
                        >
                          <span className="font-semibold text-slate-900">
                            {item.medicineName}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span>{item.dosage}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span>{item.frequency}</span>
                          <span className="text-xs text-slate-500">•</span>
                          <span>{item.durationDays} days</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p._id)}
                    disabled={deletingId === p._id}
                    className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200 disabled:opacity-60"
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
                Patient: <span className="font-semibold">{editingPrescription.patientUserId}</span>{" "}
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

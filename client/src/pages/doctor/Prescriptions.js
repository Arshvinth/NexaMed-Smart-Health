import React, { useEffect, useState } from "react";

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
    setFormItems(
      Array.isArray(p.items) && p.items.length > 0
        ? p.items.map((it) => ({ ...it, durationDays: String(it.durationDays || "") }))
        : [
            {
              medicineName: "",
              dosage: "",
              frequency: "",
              durationDays: "",
            },
          ],
    );
    setEditing(true);
  }

  function closeEdit() {
    setEditing(false);
    setEditingPrescription(null);
    setFormNotes("");
    setFormItems([]);
    setSavingEdit(false);
  }

  function updateFormItem(index, field, value) {
    setFormItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addFormItem() {
    setFormItems((prev) => [
      ...prev,
      { medicineName: "", dosage: "", frequency: "", durationDays: "" },
    ]);
  }

  function removeFormItem(index) {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingPrescription) return;

    const cleanedItems = formItems
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
      <h1 className="text-xl font-extrabold">My Patients' Prescriptions</h1>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-600">Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
          <p className="text-sm text-slate-600">
            No prescriptions found. Once you issue prescriptions, they will
            appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((p) => (
              <div
                key={p._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"
              >
                <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-700">
                  <span>
                    <span className="font-semibold">Patient ID:</span>{" "}
                    {p.patientUserId}
                  </span>
                  <span>
                    <span className="font-semibold">Appointment ID:</span>{" "}
                    {p.appointmentId}
                  </span>
                  <span>
                    <span className="font-semibold">Created:</span>{" "}
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                {p.notes ? (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Notes:</span> {p.notes}
                  </p>
                ) : null}

                {Array.isArray(p.items) && p.items.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Medicines
                    </p>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {p.items.map((item, index) => (
                        <li key={index} className="flex flex-wrap gap-2">
                          <span className="font-semibold">
                            {item.medicineName}
                          </span>
                          <span>• {item.dosage}</span>
                          <span>• {item.frequency}</span>
                          <span>• {item.durationDays} days</span>
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
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Update Prescription</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="text-sm text-slate-500 hover:text-slate-700"
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

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {formItems.map((item, index) => (
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
                          updateFormItem(index, "medicineName", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        className="min-w-[120px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                        value={item.dosage}
                        onChange={(e) =>
                          updateFormItem(index, "dosage", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. 2x daily)"
                        className="min-w-[140px] flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                        value={item.frequency}
                        onChange={(e) =>
                          updateFormItem(index, "frequency", e.target.value)
                        }
                      />
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

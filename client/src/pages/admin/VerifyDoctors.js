import React, { useEffect, useState } from "react";
import { getPendingDoctors, updateDoctorStatus } from "../../api/adminApi";

export default function VerifyDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  async function loadPending() {
    try {
      setLoading(true);
      setError("");
      const data = await getPendingDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load pending doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleUpdate(userId, status) {
    try {
      setActionLoadingId(userId);
      await updateDoctorStatus(userId, status);
      setDoctors((prev) => prev.filter((d) => d.id !== userId)); // remove processed
    } catch (err) {
      alert(err?.response?.data?.message || `Failed to set status: ${status}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Verify Doctors</h1>

      <div className="p-6 bg-white border rounded-2xl border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-600">Approve or reject pending doctor registrations.</p>
          <button
            onClick={loadPending}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading pending doctors...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : doctors.length === 0 ? (
          <p className="text-slate-500">No pending doctors right now.</p>
        ) : (
          <div className="space-y-3">
            {doctors.map((doc) => {
              const busy = actionLoadingId === doc.id;
              return (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 p-4 border rounded-xl border-slate-200 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{doc.fullName}</div>
                    <div className="text-sm text-slate-600">{doc.email}</div>
                    <div className="mt-1 text-xs text-amber-700">
                      Status: {doc.verificationStatus}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => handleUpdate(doc.id, "VERIFIED")}
                      className="px-3 py-2 text-sm font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busy ? "Processing..." : "Approve"}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleUpdate(doc.id, "REJECTED")}
                      className="px-3 py-2 text-sm font-semibold text-white rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
                    >
                      {busy ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
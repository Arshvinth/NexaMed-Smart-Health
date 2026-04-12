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

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

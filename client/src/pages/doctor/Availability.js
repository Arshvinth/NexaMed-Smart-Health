import React, { useEffect, useMemo, useState } from "react";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

const DEV_AUTH = {
  userId: process.env.REACT_APP_DOCTOR_USER_ID || "doc1",
  role: "DOCTOR",
  verificationStatus: process.env.REACT_APP_DOCTOR_VERIFICATION_STATUS || "VERIFIED",
};

function getAuthHeaders() {
  const storedUserId = localStorage.getItem("x-user-id");
  const storedRole = localStorage.getItem("x-role");
  const storedVerification = localStorage.getItem("x-verification-status");

  return {
    "x-user-id": storedUserId || DEV_AUTH.userId,
    "x-role": storedRole || DEV_AUTH.role,
    "x-verification-status": storedVerification || DEV_AUTH.verificationStatus,
  };
}

function readErrorMessage(body) {
  if (!body) return "Request failed";
  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;
  return "Request failed";
}

export default function Availability() {
  const [slots, setSlots] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchSlots() {
    const response = await fetch(`${API_GATEWAY_BASE_URL}/api/doctors/me/availability`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      let message = "Unable to load availability.";
      try {
        const body = await response.json();
        message = `${response.status}: ${readErrorMessage(body)}`;
      } catch (e) {
        message = `${response.status}: Unable to load availability.`;
      }
      throw new Error(message);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAvailability() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchSlots();
        if (!isMounted) return;
        setSlots(data);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.message || "Unable to load availability.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedSlots = useMemo(() => {
    return [...slots].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [slots]);

  async function handleAddSlot(event) {
    event.preventDefault();
    setSuccess("");

    if (!startTime || !endTime) {
      setError("Please select both start and end time.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please provide valid start and end times.");
      return;
    }

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/doctors/me/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      if (!response.ok) {
        let message = "Unable to add availability slot.";
        try {
          const body = await response.json();
          message = `${response.status}: ${readErrorMessage(body)}`;
        } catch (e) {
          message = `${response.status}: Unable to add availability slot.`;
        }
        throw new Error(message);
      }

      setStartTime("");
      setEndTime("");
      const latestSlots = await fetchSlots();
      setSlots(latestSlots);
      setSuccess("Availability slot added successfully.");
    } catch (e) {
      setError(e?.message || "Unable to add availability slot.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSlot(slotId) {
    setSuccess("");
    setError("");
    setDeletingId(slotId);

    try {
      const response = await fetch(
        `${API_GATEWAY_BASE_URL}/api/doctors/me/availability/${slotId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        let message = "Unable to delete availability slot.";
        try {
          const body = await response.json();
          message = `${response.status}: ${readErrorMessage(body)}`;
        } catch (e) {
          message = `${response.status}: Unable to delete availability slot.`;
        }
        throw new Error(message);
      }

      setSlots((prev) => prev.filter((slot) => slot._id !== slotId));
      setSuccess("Availability slot removed.");
    } catch (e) {
      setError(e?.message || "Unable to delete availability slot.");
    } finally {
      setDeletingId("");
    }
  }

  async function refreshSlots() {
    setError("");
    setSuccess("");
    setRefreshing(true);
    try {
      const latest = await fetchSlots();
      setSlots(latest);
    } catch (e) {
      setError(e?.message || "Unable to refresh availability.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Availability</h1>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Add Availability Slot</h2>

        <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Start Time</span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={loading || submitting}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">End Time</span>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={loading || submitting}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading || submitting}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Slot"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-bold text-slate-900">My Slots</h2>
          <button
            type="button"
            onClick={refreshSlots}
            disabled={loading || refreshing}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading availability slots...</p>
        ) : sortedSlots.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No availability slots found.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sortedSlots.map((slot) => (
              <div
                key={slot._id}
                className="rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">ID: {slot._id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSlot(slot._id)}
                  disabled={deletingId === slot._id}
                  className="rounded-xl border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  {deletingId === slot._id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
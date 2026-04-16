import React, { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../../utils/userAuth";

// API gateway base URL
const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";


// Helper to extract error message text from API responses
function readErrorMessage(body) {
  if (!body) return "Request failed";
  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;
  return "Request failed";
}

// Component: allows doctor to view, add, and remove availability slots
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
    // Fetch availability slots from API
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

    // Load availability when component mounts
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

  // Sort slots by start time for display
  const sortedSlots = useMemo(() => {
    return [...slots].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [slots]);

  // Validate inputs and submit a new availability slot
  async function handleAddSlot(event) {
    event.preventDefault();
    setSuccess("");

    // Required fields
    if (!startTime || !endTime) {
      setError("Both start and end time are required.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // Valid date check
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please provide valid start and end times.");
      return;
    }

    // Not in the past
    if (start <= now || end <= now) {
      setError("Start and end times must be in the future.");
      return;
    }

    // Order
    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    // Duration (in minutes)
    const duration = (end - start) / (1000 * 60);
    if (duration < 15) {
      setError("Slot duration must be at least 15 minutes.");
      return;
    }
    if (duration > 120) {
      setError("Slot duration cannot exceed 2 hours (120 minutes).");
      return;
    }

    // No overlap and no duplicate
    const overlap = slots.some((slot) => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      // Overlap: (A < D && C < B)
      return (
        (start < slotEnd && end > slotStart)
      );
    });
    if (overlap) {
      setError("This slot overlaps with an existing slot.");
      return;
    }

    const duplicate = slots.some((slot) => {
      return (
        new Date(slot.startTime).getTime() === start.getTime() &&
        new Date(slot.endTime).getTime() === end.getTime()
      );
    });
    if (duplicate) {
      setError("This slot already exists.");
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

  // Delete an availability slot by ID
  async function handleDeleteSlot(slotId) {
    setSuccess("");
    setError("");
    setDeletingId(slotId);
    try {
      // Find the slot to be deleted so we can check for overlapping appointments
      const slot = slots.find((s) => s._id === slotId);
      if (slot) {
        const slotStart = new Date(slot.startTime).getTime();
        const slotEnd = new Date(slot.endTime).getTime();

        // Load doctor's appointments and check for any that fall inside this slot
        const appointments = await listDoctorAppointments();
        const overlapping = appointments.some((a) => {
          const apptTime = a.startTime || a.appointmentTime;
          if (!apptTime) return false;
          const apptStart = new Date(apptTime).getTime();
          return apptStart >= slotStart && apptStart < slotEnd;
        });

        if (overlapping) {
          setError("This availability slot has appointments scheduled and cannot be removed.");
          return;
        }
      }

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

  // Refresh slots list from API
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

          {/* Show error below the input fields, only for add slot errors */}
          {error && (
            <div className="md:col-span-3 col-span-1 mt-2 text-xs text-rose-600">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">My Slots</h2>
          <button
            type="button"
            onClick={refreshSlots}
            disabled={loading || refreshing}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm transition disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-base text-slate-500 text-center">Loading availability slots...</p>
        ) : sortedSlots.length === 0 ? (
          <p className="mt-6 text-base text-slate-500 text-center">No availability slots found.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedSlots.map((slot) => {
              const start = new Date(slot.startTime);
              const end = new Date(slot.endTime);
              const options = { hour: '2-digit', minute: '2-digit', hour12: true };
              const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
              return (
                <div
                  key={slot._id}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white shadow-md px-6 py-5 flex flex-col gap-2 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                    <span className="text-xs font-semibold text-slate-500">
                      {start.toLocaleDateString(undefined, dateOptions)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-slate-800">
                      {start.toLocaleTimeString(undefined, options)} - {end.toLocaleTimeString(undefined, options)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Duration: {Math.round((end - start) / (1000 * 60))} min
                    </span>
                  </div>
                  <div className="flex-1"></div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot._id)}
                    disabled={deletingId === slot._id}
                    className="mt-3 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition disabled:opacity-60"
                  >
                    {deletingId === slot._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// list appointments for the logged-in doctor (used to check slot overlap)
async function listDoctorAppointments() {
  const response = await fetch(`${API_GATEWAY_BASE_URL}/api/appointments/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let message = "Unable to load appointments.";
    try {
      const body = await response.json();
      message = `${response.status}: ${readErrorMessage(body)}`;
    } catch (e) {
      message = `${response.status}: Unable to load appointments.`;
    }
    throw new Error(message);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
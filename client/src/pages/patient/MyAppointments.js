import { useState, useEffect } from "react";
import api from "../../api/client";
import { useWebSocket } from "../../hooks/useWebSocket";
import toast from "react-hot-toast";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { lastEvent } = useWebSocket(user.userId);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/api/appointments/me");
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (lastEvent) {
      // Show toast for real‑time events
      switch (lastEvent.type) {
        case "confirmed":
          toast.success("Your appointment has been confirmed!");
          break;
        case "cancelled":
          toast.info("An appointment was cancelled.");
          break;
        case "rescheduled":
          toast.success("An appointment has been rescheduled.");
          break;
        default:
          break;
      }
      fetchAppointments();
    }
  }, [lastEvent]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment? No refund.")) return;
    try {
      await api.patch(`/api/appointments/${id}/cancel`, {
        reason: "Cancelled by patient",
      });
      toast.success("Appointment cancelled successfully");
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    }
  };

  const handleReschedule = async (id, currentStartTime) => {
    // Simple prompt – you can replace with a date picker modal
    const newDate = prompt(
      "Enter new date (YYYY-MM-DD):",
      new Date(currentStartTime).toISOString().split("T")[0],
    );
    if (!newDate) return;
    const newTime = prompt("Enter new time (HH:MM, 24h format):", "09:00");
    if (!newTime) return;

    const newStartTime = new Date(`${newDate}T${newTime}:00`).toISOString();
    const newEndTime = new Date(
      new Date(newStartTime).getTime() + 15 * 60000,
    ).toISOString();
    const queueNumber = 1; // you might need to fetch the correct queue number from backend; for MVP use 1

    try {
      await api.post(`/api/appointments/${id}/reschedule`, {
        newStartTime,
        newEndTime,
        queueNumber,
      });
      toast.success("Appointment rescheduled successfully");
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reschedule failed");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Appointments</h1>
      {loading && <p>Loading...</p>}
      <div className="grid gap-4">
        {appointments.map((apt) => (
          <div
            key={apt._id}
            className="border p-4 rounded-2xl bg-white shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">
                  {apt.doctorName} ({apt.doctorSpecialization})
                </p>
                <p className="text-sm text-slate-600">
                  {new Date(apt.startTime).toLocaleString()} -{" "}
                  {new Date(apt.endTime).toLocaleTimeString()}
                </p>
                <p className="text-sm">
                  Queue #{apt.queueNumber} · Status:{" "}
                  <span
                    className={`font-semibold ${
                      apt.status === "confirmed"
                        ? "text-green-600"
                        : apt.status === "cancelled_by_patient"
                          ? "text-red-500"
                          : "text-yellow-600"
                    }`}
                  >
                    {apt.status}
                  </span>
                </p>
                {apt.meetingLink && apt.status === "confirmed" && (
                  <a
                    href={apt.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-sm underline"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                {apt.status === "pending" || apt.status === "confirmed" ? (
                  <>
                    <button
                      onClick={() => handleCancel(apt._id)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReschedule(apt._id, apt.startTime)}
                      className="px-3 py-1 text-sm border border-slate-300 rounded"
                    >
                      Reschedule
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

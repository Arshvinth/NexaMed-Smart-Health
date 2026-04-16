// frontend/src/pages/patient/AppointmentDetails.js
import { useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function AppointmentDetails({
  doctor,
  selectedSlot,
  onConfirm,
  isReschedule = false,
}) {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedSlot) {
      toast.error("No time slot selected");
      return;
    }

    setCreating(true);
    try {
      if (isReschedule) {
        // For reschedule, just call onConfirm directly without creating new appointment
        onConfirm(null);
      } else {
        // New appointment flow
        const payload = {
          doctorUserId: doctor.userId,
          doctorName: doctor.fullName,
          doctorSpecialization: doctor.specialization,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          queueNumber: selectedSlot.queueNumber,
        };

        const res = await api.post("/api/appointments", payload);
        const appointmentWithFee = {
          ...res.data,
          paymentAmount: doctor.fee,
          doctorFee: doctor.fee,
        };
        toast.success("Appointment created! Proceed to payment.");
        onConfirm(appointmentWithFee);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!selectedSlot) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
        <p className="text-slate-500">
          No time slot selected. Please go back and select a time slot.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          {isReschedule ? "Reschedule Appointment" : "Appointment Details"}
        </h3>

        <div className="space-y-3 divide-y divide-slate-100">
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Doctor</span>
            <span className="font-medium text-slate-800">
              {doctor?.fullName || "N/A"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Speciality</span>
            <span className="font-medium text-slate-800">
              {doctor?.specialization || "N/A"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Date</span>
            <span className="font-medium text-slate-800">
              {formatDate(selectedSlot.startTime)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Start Time</span>
            <span className="font-medium text-slate-800">
              {formatTime(selectedSlot.startTime)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">End Time</span>
            <span className="font-medium text-slate-800">
              {formatTime(selectedSlot.endTime)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Queue No.</span>
            <span className="font-mono font-bold text-slate-800">
              #{selectedSlot.queueNumber}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Fees</span>
            <span className="font-bold text-slate-800">
              ${doctor?.fee || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button
          onClick={handleCreate}
          disabled={creating}
          className={`px-6 py-2.5 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
            isReschedule
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700"
          }`}
        >
          {creating ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              {isReschedule ? "Confirm Reschedule" : "Confirm and Pay"}
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

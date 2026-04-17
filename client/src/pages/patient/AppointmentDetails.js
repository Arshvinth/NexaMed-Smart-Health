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
      toast.error("No time slot selected", {
        duration: 4000,
        style: {
          background: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          padding: "12px",
          borderRadius: "12px",
        },
      });
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
        toast.success("Appointment created! Proceeding to payment...", {
          duration: 4000,
          style: {
            background: "#f0fdf4",
            color: "#16a34a",
            border: "1px solid #bbf7d0",
            padding: "12px",
            borderRadius: "12px",
          },
        });
        onConfirm(appointmentWithFee);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed", {
        duration: 4000,
        style: {
          background: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          padding: "12px",
          borderRadius: "12px",
        },
      });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
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
      <div className="bg-neutral-50 rounded-2xl shadow-soft border border-neutral-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-neutral-700 font-medium">No time slot selected</p>
        <p className="text-neutral-500 text-sm mt-1">
          Please go back and select a time slot
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary-100 to-secondary-100 px-6 py-5 border-b border-neutral-200">
        <h3 className="text-xl font-display font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
          {isReschedule ? "Reschedule Appointment" : "Appointment Details"}
        </h3>
        <p className="text-neutral-600 text-sm mt-1">
          Please review your appointment information below
        </p>
      </div>

      {/* Details Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doctor Info */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Doctor
              </span>
            </div>
            <p className="font-semibold text-neutral-900 text-base">
              {doctor?.fullName || "N/A"}
            </p>
          </div>

          {/* Specialty */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Specialty
              </span>
            </div>
            <p className="font-semibold text-neutral-900 text-base">
              {doctor?.specialization || "N/A"}
            </p>
          </div>

          {/* Date */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Date
              </span>
            </div>
            <p className="font-semibold text-neutral-900 text-base">
              {formatDate(selectedSlot.startTime)}
            </p>
          </div>

          {/* Queue No */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Queue No.
              </span>
            </div>
            <p className="font-mono font-bold text-primary-700 text-xl">
              #{selectedSlot.queueNumber}
            </p>
          </div>

          {/* Start Time */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Start Time
              </span>
            </div>
            <p className="font-semibold text-neutral-900 text-base">
              {formatTime(selectedSlot.startTime)}
            </p>
          </div>

          {/* End Time */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                End Time
              </span>
            </div>
            <p className="font-semibold text-neutral-900 text-base">
              {formatTime(selectedSlot.endTime)}
            </p>
          </div>

          {/* Fees - Light Yellow Box with conditional message for reschedule */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 md:col-span-2 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Total Fees
                  </span>
                </div>
                {isReschedule ? (
                  <p className="font-bold text-amber-700 text-2xl">$0</p>
                ) : (
                  <p className="font-bold text-amber-700 text-3xl">
                    ${doctor?.fee || 0}
                  </p>
                )}
              </div>
              <div className="text-right">
                {isReschedule ? (
                  <>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>No need to pay</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Already paid for cancelled appointment</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Including all taxes</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>Secure payment</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 py-5 bg-neutral-100 border-t border-neutral-200 flex justify-end">
        <button
          onClick={handleCreate}
          disabled={creating}
          className={`group px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
            isReschedule
              ? "bg-gradient-to-r from-warning-500 to-orange-600 hover:from-warning-600 hover:to-orange-700 text-white"
              : "bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 text-white"
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

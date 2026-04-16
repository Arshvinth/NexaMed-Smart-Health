// frontend/src/pages/patient/MyAppointments.js
import { useState, useEffect } from "react";
import api from "../../api/client";
import { useWebSocket } from "../../hooks/useWebSocket";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { lastEvent } = useWebSocket(user.userId);
  const navigate = useNavigate();

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track which appointments are currently being rescheduled
  const [reschedulingAppointmentId, setReschedulingAppointmentId] =
    useState(null);

  // Track rescheduled appointments (both old and new)
  const [rescheduledAppointmentIds, setRescheduledAppointmentIds] = useState(
    new Set(),
  );

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/api/appointments/me");
      const allAppointments = res.data;

      // Find which appointments are related to rescheduling
      const rescheduledIds = new Set();

      allAppointments.forEach((apt) => {
        // If this appointment was created from a reschedule (it's the new one)
        if (apt.rescheduleFromId) {
          rescheduledIds.add(apt.rescheduleFromId); // Mark the old appointment as rescheduled
          rescheduledIds.add(apt._id); // Also mark this new appointment as rescheduled
        }
      });

      setRescheduledAppointmentIds(rescheduledIds);

      const now = new Date();
      const sorted = allAppointments.sort((a, b) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        const isAFuture = dateA >= now;
        const isBFuture = dateB >= now;

        if (isAFuture && isBFuture) return dateA - dateB;
        if (!isAFuture && !isBFuture) return dateB - dateA;
        if (isAFuture && !isBFuture) return -1;
        if (!isAFuture && isBFuture) return 1;
        return 0;
      });

      setAppointments(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (lastEvent) {
      switch (lastEvent.type) {
        case "confirmed":
          toast.success("Your appointment has been confirmed!");
          break;
        case "cancelled":
          toast("An appointment was cancelled.");
          break;
        case "rescheduled":
          toast.success("An appointment has been rescheduled.");
          break;
        default:
          break;
      }
      fetchAppointments();
      setReschedulingAppointmentId(null);
    }
  }, [lastEvent]);

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancelReason("");
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/api/appointments/${selectedAppointment._id}/cancel`, {
        reason: cancelReason,
      });
      toast.success("Appointment cancelled successfully");
      closeCancelModal();
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (appointment) => {
    // Prevent multiple reschedule clicks
    if (reschedulingAppointmentId === appointment._id) {
      toast.error("Already rescheduling this appointment");
      return;
    }

    // Check if appointment has already been rescheduled
    if (rescheduledAppointmentIds.has(appointment._id)) {
      toast.error("This appointment has already been rescheduled");
      return;
    }

    setReschedulingAppointmentId(appointment._id);

    navigate("/patient/book", {
      state: {
        rescheduleMode: true,
        originalAppointment: appointment,
        doctor: {
          userId: appointment.doctorUserId,
          fullName: appointment.doctorName,
          specialization: appointment.doctorSpecialization,
        },
      },
    });
  };

  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const paginatedAppointments = appointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDoctorDisplayName = (name) => {
    if (!name) return "Doctor";
    if (name.toLowerCase().startsWith("dr.")) return name;
    return `Dr. ${name}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: {
        label: "Pending",
        color: "bg-amber-100 text-amber-700",
        icon: "⏳",
      },
      confirmed: {
        label: "Confirmed",
        color: "bg-emerald-100 text-emerald-700",
        icon: "✓",
      },
      cancelled_by_patient: {
        label: "Cancelled by You",
        color: "bg-red-100 text-red-700",
        icon: "✗",
      },
      cancelled_by_doctor: {
        label: "Cancelled by Doctor",
        color: "bg-red-100 text-red-700",
        icon: "✗",
      },
      completed: {
        label: "Completed",
        color: "bg-slate-100 text-slate-700",
        icon: "✔",
      },
    };
    return (
      statusMap[status] || {
        label: status,
        color: "bg-slate-100 text-slate-700",
        icon: "📋",
      }
    );
  };

  const getCancellationReason = (apt) => {
    if (apt.cancellationReason) return apt.cancellationReason;
    if (apt.status === "cancelled_by_patient") return "Cancelled by patient";
    if (apt.status === "cancelled_by_doctor") return "Cancelled by doctor";
    return null;
  };

  // Check if appointment has been rescheduled (using rescheduleFromId)
  const hasBeenRescheduled = (apt) => {
    return rescheduledAppointmentIds.has(apt._id);
  };

  // Check if this is a new appointment created from reschedule
  const isRescheduledAppointment = (apt) => {
    return apt.rescheduleFromId;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
        <span className="text-sm text-slate-500">
          {appointments.length} total
        </span>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-primary-500">
            Loading appointments...
          </div>
        </div>
      )}

      {!loading && paginatedAppointments.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
          No appointments found. Book your first appointment!
        </div>
      )}

      <div className="grid gap-5">
        {paginatedAppointments.map((apt) => {
          const statusBadge = getStatusBadge(apt.status);
          const cancellationReason = getCancellationReason(apt);
          const isCancelled =
            apt.status === "cancelled_by_patient" ||
            apt.status === "cancelled_by_doctor";
          const isRescheduled = hasBeenRescheduled(apt);
          const isNewRescheduledAppointment = isRescheduledAppointment(apt);
          const isCurrentlyRescheduling = reschedulingAppointmentId === apt._id;

          // Show reschedule button ONLY for cancelled appointments that have NOT been rescheduled
          const showRescheduleButton =
            isCancelled && !isRescheduled && !isNewRescheduledAppointment;

          // Show cancel button for confirmed appointments (including rescheduled ones)
          const showCancelButton = apt.status === "confirmed";

          // For rescheduled appointments, ONLY show the blue Rescheduled badge (no Confirmed badge)
          const showOnlyRescheduledBadge =
            isNewRescheduledAppointment && apt.status === "confirmed";

          return (
            <div
              key={apt._id}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition ${
                isCancelled ? "border-red-200" : "border-slate-200"
              }`}
            >
              <div className="p-5">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-lg">
                        {getDoctorDisplayName(apt.doctorName)}
                      </h3>
                      {/* Show status badge only for non-rescheduled appointments */}
                      {!showOnlyRescheduledBadge && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                        >
                          <span>{statusBadge.icon}</span>
                          {statusBadge.label}
                        </span>
                      )}
                      {/* For rescheduled appointments, ONLY show the blue Rescheduled badge */}
                      {showOnlyRescheduledBadge && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
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
                          Rescheduled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary-600">
                      {apt.doctorSpecialization}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Date & Time:</span>
                        <span className="ml-2 text-slate-700">
                          {formatDateTime(apt.startTime)} –{" "}
                          {formatTime(apt.endTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Queue No:</span>
                        <span className="ml-2 font-mono font-bold text-slate-700">
                          #{apt.queueNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fees:</span>
                        <span className="ml-2 font-medium text-slate-700">
                          $
                          {apt.paymentAmount
                            ? apt.paymentAmount
                            : apt.amount || "—"}
                        </span>
                      </div>
                    </div>

                    {apt.meetingLink && apt.status === "confirmed" && (
                      <div className="pt-2">
                        <a
                          href={apt.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 text-sm font-medium hover:text-primary-700"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Join Meeting
                        </a>
                      </div>
                    )}

                    {/* Info message for rescheduled new appointments */}
                    {showOnlyRescheduledBadge && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-800">
                              ⚠️ You can cancel this already rescheduled
                              appointment, but you cannot reschedule it again.
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              This was created when rescheduling a previously
                              cancelled appointment. Only one reschedule is
                              allowed per booking.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info message for regular confirmed appointments */}
                    {apt.status === "confirmed" &&
                      !showOnlyRescheduledBadge && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div className="flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"
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
                            <div className="flex-1">
                              <p className="text-xs font-medium text-emerald-800">
                                ✓ Your appointment is confirmed. If you want you
                                can cancel and reschedule this appointment to
                                another one.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="flex gap-2 self-end">
                    {showCancelButton && (
                      <button
                        onClick={() => openCancelModal(apt)}
                        className="px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Cancel booking
                      </button>
                    )}
                    {showRescheduleButton && (
                      <button
                        onClick={() => handleReschedule(apt)}
                        disabled={isCurrentlyRescheduling}
                        className={`px-4 py-2 text-sm font-medium rounded-xl shadow-sm flex items-center gap-2 transition-all ${
                          isCurrentlyRescheduling
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}
                      >
                        {isCurrentlyRescheduling ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
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
                            <svg
                              className="w-4 h-4"
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
                            Reschedule
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Cancellation Reason - Only show for cancelled appointments */}
                {isCancelled && cancellationReason && (
                  <div className="mt-4 -mx-5 px-5 py-3 bg-red-50 border-t border-red-100">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                          Cancellation Reason
                        </p>
                        <p className="text-sm text-red-600 mt-0.5">
                          {cancellationReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-300 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Cancel Appointment
                    </h3>
                    <p className="text-sm text-slate-500">
                      Please provide a reason for cancellation
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCancelModal}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Patient request, Schedule conflict, Change of plans, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-2">
                  This reason will be shared with the doctor
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeCancelModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={submitting || !cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      Cancelling...
                    </>
                  ) : (
                    "Confirm Cancellation"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

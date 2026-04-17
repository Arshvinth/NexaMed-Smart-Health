// frontend/src/pages/patient/TimeSlots.js
import { useState, useEffect } from "react";
import api from "../../api/client";
import { useWebSocket } from "../../hooks/useWebSocket";
import toast from "react-hot-toast";

export default function TimeSlots({
  doctor,
  selectedBlock,
  onSelectSlot,
  isReschedule = false,
}) {
  const [allSlots, setAllSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { lastEvent } = useWebSocket(doctor?.userId);

  // Generate 15‑min slots from a time block
  const generateSlotsFromBlock = (blockStart, blockEnd) => {
    const slots = [];
    let current = new Date(blockStart);
    const end = new Date(blockEnd);
    let queueNum = 1;
    while (current < end) {
      const slotEnd = new Date(current.getTime() + 15 * 60000);
      if (slotEnd > end) break;
      slots.push({
        startTime: new Date(current).toISOString(),
        endTime: new Date(slotEnd).toISOString(),
        queueNumber: queueNum++,
        available: true,
      });
      current = slotEnd;
    }
    return slots;
  };

  // Fetch already booked appointments for this doctor on this date
  const fetchBookedAppointments = async (doctorUserId, date) => {
    try {
      // Fetch all appointments for this doctor on this date
      // Since we don't have a direct endpoint, we'll use the slots endpoint which should return available status
      const slotsRes = await api.get(`/api/appointments/slots`, {
        params: { doctorUserId, date },
      });
      return slotsRes.data; // Returns slots with available: true/false
    } catch (err) {
      console.warn("Could not fetch booked slots, using local generation", err);
      return [];
    }
  };

  const fetchSlots = async () => {
    if (!doctor || !selectedBlock) return;
    setLoading(true);
    try {
      const date = new Date(selectedBlock.startTime)
        .toISOString()
        .split("T")[0];

      // Try to get slots from backend with availability status
      let slotsWithAvailability = [];
      try {
        const response = await api.get(`/api/appointments/slots`, {
          params: { doctorUserId: doctor.userId, date },
        });
        slotsWithAvailability = response.data;
      } catch (err) {
        console.warn(
          "Backend slots endpoint failed, using local generation",
          err,
        );
      }

      let slots = [];
      if (slotsWithAvailability && slotsWithAvailability.length > 0) {
        // Filter slots within the selected time block
        const blockStart = new Date(selectedBlock.startTime).getTime();
        const blockEnd = new Date(selectedBlock.endTime).getTime();
        slots = slotsWithAvailability.filter((slot) => {
          const slotStart = new Date(slot.startTime).getTime();
          const slotEnd = new Date(slot.endTime).getTime();
          return slotStart >= blockStart && slotEnd <= blockEnd;
        });
      } else {
        // Fallback: generate slots locally and mark them all as available
        slots = generateSlotsFromBlock(
          selectedBlock.startTime,
          selectedBlock.endTime,
        );

        // Try to fetch booked appointments separately
        try {
          const appointmentsRes = await api.get(`/api/appointments/me`);
          // Filter appointments for this doctor on this date
          const dateStr = new Date(selectedBlock.startTime)
            .toISOString()
            .split("T")[0];
          const bookedAppointments = appointmentsRes.data.filter((apt) => {
            const aptDate = new Date(apt.startTime).toISOString().split("T")[0];
            return (
              apt.doctorUserId === doctor.userId &&
              aptDate === dateStr &&
              (apt.status === "pending" || apt.status === "confirmed")
            );
          });

          // Mark slots as booked if they match existing appointments
          slots = slots.map((slot) => {
            const isBooked = bookedAppointments.some((apt) => {
              const aptStart = new Date(apt.startTime).getTime();
              const slotStart = new Date(slot.startTime).getTime();
              return aptStart === slotStart;
            });
            return { ...slot, available: !isBooked };
          });
        } catch (err) {
          console.warn("Could not fetch booked appointments", err);
        }
      }

      setAllSlots(slots);
    } catch (err) {
      console.error("Failed to load slots", err);
      const fallback = generateSlotsFromBlock(
        selectedBlock.startTime,
        selectedBlock.endTime,
      );
      setAllSlots(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [doctor, selectedBlock]);

  // Real‑time refresh when an appointment changes (cancel/booking)
  useEffect(() => {
    if (lastEvent && doctor && selectedBlock) {
      fetchSlots();
    }
  }, [lastEvent]);

  // Pagination
  const totalPages = Math.ceil(allSlots.length / itemsPerPage);
  const paginatedSlots = allSlots.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDoctorDisplayName = () => {
    const name = doctor?.fullName || "";
    return name.toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          Time Slots
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
          <p className="text-neutral-600 font-medium">
            {getDoctorDisplayName()} · {formatDate(selectedBlock?.startTime)}
          </p>
        </div>
        {isReschedule && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-warning-50 text-warning-700 rounded-full text-xs font-medium border border-warning-200">
            <svg
              className="w-3.5 h-3.5"
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
            <span>Reschedule mode – select a new time slot</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
          <p className="text-transit-muted mt-4 text-sm animate-pulse">
            Loading available time slots...
          </p>
        </div>
      )}

      {!loading && paginatedSlots.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-b from-neutral-50 to-white rounded-2xl border border-neutral-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
            <svg
              className="h-8 w-8 text-neutral-400"
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
          </div>
          <p className="text-neutral-500 text-lg font-medium">
            No time slots available
          </p>
          <p className="text-neutral-400 text-sm mt-1">
            No 15‑minute slots available in the selected time block.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {paginatedSlots.map((slot, index) => (
          <button
            key={`${slot.startTime}-${slot.queueNumber || index}`}
            onClick={() => {
              if (slot.available) {
                onSelectSlot(slot);
              } else {
                toast.error(
                  "This time slot is already booked. Please select another slot.",
                );
              }
            }}
            disabled={!slot.available}
            className={`group relative p-5 rounded-2xl transition-all duration-300 text-left overflow-hidden ${
              slot.available
                ? "bg-white border border-neutral-100 shadow-soft hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 cursor-pointer"
                : "bg-neutral-50 border border-neutral-200 opacity-60 cursor-not-allowed"
            }`}
          >
            {/* Decorative gradient for available slots on hover */}
            {slot.available && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary-50/0 via-primary-50/0 to-primary-50/0 group-hover:from-primary-50/20 group-hover:via-primary-50/10 group-hover:to-transparent transition-all duration-500"></div>
            )}

            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Queue Number */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-primary-700 font-bold text-sm">
                        #{slot.queueNumber}
                      </span>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="flex items-center gap-2 mt-3">
                    <svg
                      className="w-4 h-4 text-secondary-500"
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
                    <p className="font-semibold text-neutral-800 text-base">
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </p>
                  </div>
                </div>

                {/* Status with colored dot only */}
                {slot.available ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                    <span className="text-xs font-semibold text-emerald-700">
                      Available
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"></div>
                    <span className="text-xs font-semibold text-rose-700">
                      Booked
                    </span>
                  </div>
                )}
              </div>

              {/* Select indicator for available slots on hover */}
              {slot.available && (
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center justify-end gap-1 text-xs font-medium text-primary-600">
                    <span>Select this slot</span>
                    <svg
                      className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
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
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

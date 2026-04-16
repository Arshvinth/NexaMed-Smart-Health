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
        <h2 className="text-2xl font-bold text-slate-800">Time Slots</h2>
        <p className="text-sm text-slate-500 mt-1">
          {getDoctorDisplayName()} · {formatDate(selectedBlock?.startTime)}
        </p>
        {isReschedule && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">
            <span>🔄</span> Reschedule mode – select a new time slot
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-primary-500">
            Loading time slots...
          </div>
        </div>
      )}

      {!loading && paginatedSlots.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
          No 15‑minute slots available in the selected time block.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
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
            className={`p-4 rounded-xl border transition-all text-left ${
              slot.available
                ? "bg-white border-slate-200 hover:border-primary-400 hover:shadow-md hover:shadow-primary-100 cursor-pointer hover:-translate-y-0.5"
                : "bg-slate-100 border-slate-200 opacity-70 cursor-not-allowed"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono font-bold text-slate-700 text-lg">
                  Queue #{slot.queueNumber}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </div>
              </div>
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  slot.available
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {slot.available ? "Available" : "Booked"}
              </div>
            </div>
          </button>
        ))}
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
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              ← Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// frontend/src/pages/patient/DoctorAvailability.js
import { useState, useEffect } from "react";
import api from "../../api/client";

export default function DoctorAvailability({ doctor, onSelectDateTime }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    if (!doctor) return;
    setLoading(true);
    api
      .get(`/api/doctors/${doctor.userId}/availability`)
      .then((res) => {
        const sorted = [...res.data].sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime),
        );
        setAvailability(sorted);
      })
      .finally(() => setLoading(false));
  }, [doctor]);

  const totalPages = Math.ceil(availability.length / itemsPerPage);
  const paginatedItems = availability.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // Format: "Sun, 19 April 2026"
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Format: "15:00 – 17:00"
  const formatTimeRange = (start, end) => {
    const startTime = new Date(start).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = new Date(end).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${startTime} – ${endTime}`;
  };

  const getDoctorDisplayName = () => {
    const name = doctor.fullName || "";
    if (name.toLowerCase().startsWith("dr.")) return name;
    return `Dr. ${name}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Available Dates & Times
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {getDoctorDisplayName()} · {doctor.specialization}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-primary-500 text-sm">
            Loading availability...
          </div>
        </div>
      )}

      {!loading && paginatedItems.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl text-sm">
          No availability slots found for this doctor.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedItems.map((slot, idx) => {
          const date = formatDate(slot.startTime);
          const timeRange = formatTimeRange(slot.startTime, slot.endTime);
          return (
            <button
              key={idx}
              onClick={() => onSelectDateTime(slot)}
              className="group text-left p-4 bg-white rounded-xl border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5"
            >
              <div className="text-sm text-slate-500">Date</div>
              <div className="font-medium text-slate-800 text-sm mt-0.5">
                {date}
              </div>
              <div className="text-sm text-slate-500 mt-2">Time</div>
              <div className="font-medium text-primary-600 text-sm mt-0.5">
                {timeRange}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-500"></span>
                <span className="text-xs font-medium text-success-600">
                  Available
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, availability.length)} of{" "}
            {availability.length} slots
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              ← Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

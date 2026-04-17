// frontend/src/pages/patient/DoctorAvailability.js
import { useState, useEffect } from "react";
import api from "../../api/client";

export default function DoctorAvailability({ doctor, onSelectDateTime }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  // Generate page numbers to show (max 5 at a time)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxPagesToShow - 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
    }
    return pageNumbers;
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
        <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          Available Dates & Times
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
          <p className="text-neutral-600 font-medium">
            {getDoctorDisplayName()} · {doctor.specialization}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
          <p className="text-transit-muted mt-4 text-sm animate-pulse">
            Loading available slots...
          </p>
        </div>
      )}

      {!loading && paginatedItems.length === 0 && (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">
            No availability slots
          </p>
          <p className="text-neutral-400 text-sm mt-1">
            No time slots found for this doctor.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {paginatedItems.map((slot, idx) => {
          const date = formatDate(slot.startTime);
          const timeRange = formatTimeRange(slot.startTime, slot.endTime);
          return (
            <button
              key={idx}
              onClick={() => onSelectDateTime(slot)}
              className="group text-left p-5 bg-white rounded-2xl border border-neutral-100 shadow-soft transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200"
            >
              {/* Date Section */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-primary-500"
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
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                      Date
                    </span>
                  </div>
                  <p className="font-semibold text-neutral-800 text-base">
                    {date}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-neutral-100"></div>

              {/* Time Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
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
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Time
                  </span>
                </div>
                <p className="font-bold text-primary-600 text-lg">
                  {timeRange}
                </p>
              </div>

              {/* Select indicator on hover */}
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
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentPage === pageNum
                    ? "bg-primary-600 text-white shadow-sm"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
            >
              Next
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// frontend/src/pages/patient/DoctorSelection.js
import { useState, useEffect } from "react";
import api from "../../api/client";

export default function DoctorSelection({ onSelectDoctor }) {
  const [allDoctors, setAllDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setLoading(true);
    // Try without verified filter first to get all doctors
    api
      .get("/api/doctors")
      .then((res) => {
        let doctors = res.data;

        // If doctors is an object with a doctors property, extract it
        if (doctors.doctors) {
          doctors = doctors.doctors;
        }

        // If doctors is not an array, make it an array
        if (!Array.isArray(doctors)) {
          doctors = [];
        }

        console.log("Fetched doctors:", doctors);

        // Filter only verified doctors if needed (case insensitive)
        const verifiedDoctors = doctors.filter(
          (doc) =>
            doc.verificationStatus === "VERIFIED" ||
            doc.verificationStatus === "verified" ||
            doc.verified === true,
        );

        // Use verified doctors if any, otherwise use all
        const doctorsToShow =
          verifiedDoctors.length > 0 ? verifiedDoctors : doctors;

        console.log("Doctors to show:", doctorsToShow);

        setAllDoctors(doctorsToShow);

        // Extract unique specialties
        const unique = [
          ...new Set(
            doctorsToShow.map((d) => d.specialization).filter(Boolean),
          ),
        ];
        console.log("Unique specialties:", unique);
        setSpecialties(unique);
      })
      .catch((err) => {
        console.error("Failed to fetch doctors", err);
        // Fallback: try with verified param
        api
          .get("/api/doctors", { params: { verified: true } })
          .then((res) => {
            let doctors = res.data;
            if (doctors.doctors) doctors = doctors.doctors;
            if (!Array.isArray(doctors)) doctors = [];
            setAllDoctors(doctors);
            const unique = [
              ...new Set(doctors.map((d) => d.specialization).filter(Boolean)),
            ];
            setSpecialties(unique);
          })
          .catch((err2) => console.error("Fallback also failed:", err2));
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredDoctors = selectedSpecialty
    ? allDoctors.filter((doc) => doc.specialization === selectedSpecialty)
    : allDoctors;

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = filteredDoctors.slice(
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with gradient accent */}
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 bg-clip-text text-transparent">
          Find Your Doctor
        </h2>
        <p className="text-transit-muted mt-2 text-sm">
          Browse verified specialists and book your appointment
        </p>
      </div>

      {/* Search section with enhanced styling */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-neutral-100 transition-all duration-200 hover:shadow-md">
        <label className="block text-sm font-semibold text-neutral-800 mb-2">
          Search by speciality
        </label>
        <div className="relative">
          <select
            className="w-full p-3 pl-4 pr-10 border border-neutral-200 rounded-xl bg-white text-neutral-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition appearance-none cursor-pointer"
            value={selectedSpecialty}
            onChange={(e) => {
              setSelectedSpecialty(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">
              All Specialities ({allDoctors.length} doctors)
            </option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s} ({allDoctors.filter((d) => d.specialization === s).length})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-primary-500">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col justify-center items-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          <p className="text-transit-muted mt-4 text-sm animate-pulse">
            Loading expert doctors...
          </p>
        </div>
      )}

      {!loading && paginatedDoctors.length === 0 && (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">
            No doctors found
          </p>
          <p className="text-neutral-400 text-sm mt-1">
            Please check back later or try different filters.
          </p>
        </div>
      )}

      {/* Doctor Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedDoctors.map((doc) => (
          <div
            key={doc._id || doc.userId}
            className="group bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
          >
            <div className="p-5 flex-1">
              {/* Name with gradient hover effect */}
              <h3 className="text-xl font-display font-bold text-neutral-800 group-hover:text-primary-700 transition-colors duration-200">
                {doc.fullName}
              </h3>

              {/* Specialization with decorative dot and icon */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                <p className="text-primary-600 font-medium text-base">
                  {doc.specialization}
                </p>
              </div>

              {/* Registration No with icon */}
              <div className="flex items-center gap-2 text-sm text-neutral-500 mt-3">
                <svg
                  className="w-4 h-4 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2H15a3 3 0 00-2.83-2M9 14h6"
                  />
                </svg>
                <span>Reg No: {doc.registrationNo || "N/A"}</span>
              </div>

              {/* Experience & Fee row */}
              <div className="grid grid-cols-2 gap-3 mt-5 py-3 border-t border-b border-neutral-100">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-neutral-500 text-sm">Experience</span>
                  </div>
                  <p className="font-semibold text-neutral-800 text-lg">
                    {doc.experience || doc.experienceYears || 0} years
                  </p>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg
                      className="w-4 h-4 text-success-500"
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
                    <span className="text-neutral-500 text-sm">
                      Consultation Fee
                    </span>
                  </div>
                  <p className="font-bold text-success-600 text-xl">
                    ${doc.fee}
                  </p>
                </div>
              </div>

              {/* Full bio with icon */}
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
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
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <span className="text-neutral-500 text-sm font-medium">
                    Bio
                  </span>
                </div>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  {doc.bio ||
                    "Experienced doctor dedicated to patient care with a compassionate approach."}
                </p>
              </div>
            </div>

            {/* Button row with gradient button */}
            <div className="px-5 pb-5 pt-2 flex justify-end border-t border-neutral-100 bg-gradient-to-r from-neutral-50/30 to-white">
              <button
                onClick={() => onSelectDoctor(doc)}
                className="group/btn px-6 py-2.5 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl text-sm font-semibold hover:from-secondary-600 hover:to-secondary-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <span>Select Doctor</span>
                <svg
                  className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Pagination with Numbered Buttons - Compact Size */}
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

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
    api
      .get("/api/doctors", { params: { verified: true } })
      .then((res) => {
        const doctors = res.data;
        setAllDoctors(doctors);
        const unique = [
          ...new Set(doctors.map((d) => d.specialization).filter(Boolean)),
        ];
        setSpecialties(unique);
      })
      .catch((err) => console.error("Failed to fetch doctors", err))
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

  return (
    <div className="space-y-8">
      {/* Search section with primary color */}
      <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100">
        <label className="block text-base font-semibold text-slate-800 mb-2">
          Search by speciality
        </label>
        <select
          className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          value={selectedSpecialty}
          onChange={(e) => {
            setSelectedSpecialty(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Specialities</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-primary-600">
            Loading doctors...
          </div>
        </div>
      )}

      {!loading && paginatedDoctors.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
          No doctors found.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedDoctors.map((doc) => (
          <div
            key={doc._id || doc.userId}
            className="group bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className="p-5 flex-1">
              {/* Name */}
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary-700 transition">
                {doc.fullName}
              </h3>
              {/* Specialization - using primary color */}
              <p className="text-primary-600 font-medium text-base mt-1">
                {doc.specialization}
              </p>
              {/* Registration No */}
              <p className="text-sm text-slate-500 mt-2">
                Reg No: {doc.registrationNo || "N/A"}
              </p>

              {/* Experience & Fee row */}
              <div className="grid grid-cols-2 gap-3 mt-4 py-3 border-t border-b border-slate-100">
                <div>
                  <span className="text-slate-500 text-sm">Experience</span>
                  <p className="font-semibold text-slate-800">
                    {doc.experience || doc.experienceYears || 0} years
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-sm">Fee</span>
                  <p className="font-bold text-success-600 text-lg">
                    ${doc.fee}
                  </p>
                </div>
              </div>

              {/* Full bio */}
              <div className="mt-4">
                <span className="text-slate-500 text-sm">Bio</span>
                <p className="text-slate-700 text-sm mt-1 leading-relaxed">
                  {doc.bio || "Experienced doctor dedicated to patient care."}
                </p>
              </div>
            </div>

            {/* Button row */}
            <div className="px-5 pb-5 pt-2 flex justify-end border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => onSelectDoctor(doc)}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow-sm hover:shadow-md"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              ← Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

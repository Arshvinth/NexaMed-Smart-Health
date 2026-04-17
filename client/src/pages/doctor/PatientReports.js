import React, { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../../utils/userAuth";
import { useParams } from "react-router-dom";

// Page: Patient Reports — view patient profiles and uploaded medical reports
// API gateway base URL for backend requests
const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

// Helper: load confirmed appointments for the logged-in doctor
async function fetchDoctorAppointments() {
  const res = await fetch(
    `${API_GATEWAY_BASE_URL}/api/appointments/me?status=confirmed`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Failed to load appointments.");
  }

  return res.json();
}

// Helper: fetch all patient profiles from patient-service
async function fetchAllPatients() {
  const res = await fetch(`${API_GATEWAY_BASE_URL}/api/patients`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Failed to load patient profiles.");
  }

  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : [];
}

// Helper: fetch medical reports for a specific patient (by patient _id)
async function fetchMedicalReports(patientId) {
  const res = await fetch(
    `${API_GATEWAY_BASE_URL}/api/medical-reports/${patientId}`,
    { headers: getAuthHeaders() },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Failed to load medical reports.");
  }

  const data = await res.json();

  return Array.isArray(data?.data) ? data.data : [];
}

// Helper: fetch a user profile from user-service (may be wrapped in `data`)
async function fetchUserProfile(userId) {
  const url = `${API_GATEWAY_BASE_URL}/api/auth/users/${userId}`;
  const headers = getAuthHeaders();
  const res = await fetch(url, {
    method: "GET",
    headers,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  if (!res.ok) {
    throw new Error("Failed to load user profile");
  }
  // Prefer `data.data` when present, otherwise return the parsed object.
  return data?.data ?? data ?? {};
}

// Component: patient reports UI and state
export default function PatientReports() {
  // Route param holds patient userId (e.g., "pat1") when navigated with it
  const { patientId: routePatientUserId } = useParams();

  // Local state: appointments and patient service data
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected patient userId and their fetched reports
  const [selectedPatientUserId, setSelectedPatientUserId] = useState(
    routePatientUserId || "",
  );
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Cache of user profiles (from user-service) and report loading errors
  const [userProfiles, setUserProfiles] = useState({});
  const [reportsError, setReportsError] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  // Load doctor appointments + all patient profiles on first render
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [apptData, patientData] = await Promise.all([
          fetchDoctorAppointments(),
          fetchAllPatients(),
        ]);

        if (!active) return;

        setAppointments(Array.isArray(apptData) ? apptData : []);
        setPatients(patientData);
      } catch (e) {
        if (!active) return;
        setError(e?.message || "Unable to load patient reports.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  // Compute patients that actually have appointments with this doctor
  const doctorPatients = useMemo(() => {
    // Build a set of patient userIds from appointments
    const userIdSet = new Set(
      appointments
        .filter((a) => a && a.patientUserId)
        .map((a) => a.patientUserId),
    );

    // Attach profile info where available
    return Array.from(userIdSet).map((userId) => {
      const profile = patients.find((p) => p.userId === userId) || null;
      // Gather this patient's appointments for quick stats
      const patientAppointments = appointments.filter(
        (a) => a.patientUserId === userId,
      );

      const lastAppointment = patientAppointments
        .slice()
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];

      return {
        userId,
        profile,
        appointments: patientAppointments,
        lastAppointment,
      };
    });
  }, [appointments, patients]);

  // Filter doctorPatients by search term (patient name or id)
  const filteredDoctorPatients = useMemo(() => {
    const q = (patientSearch || "").trim().toLowerCase();
    if (!q) return doctorPatients;

    return doctorPatients.filter((p) => {
      const displayName = (
        userProfiles[p.userId]?.fullName || p.profile?.fullName || p.userId || ""
      ).toString().toLowerCase();
      return displayName.includes(q) || (p.userId || "").toLowerCase().includes(q);
    });
  }, [doctorPatients, userProfiles, patientSearch]);

  // Find the currently selected patient (by userId) from computed list
  const selectedPatient = useMemo(
    () =>
      doctorPatients.find((p) => p.userId === selectedPatientUserId) || null,
    [doctorPatients, selectedPatientUserId],
  );

  // Load medical reports when a patient selection changes and profile is known
  useEffect(() => {
    if (!selectedPatient || !selectedPatient.profile?._id) {
      setReports([]);
      setReportsError("");
      return;
    }

    let active = true;

    async function loadReports() {
      setReportsLoading(true);
      setReportsError("");
      try {
        console.log(`Loading medical reports for patient userId: ${selectedPatient.userId}, patient MongoDB ID: ${selectedPatient.profile.userId}`);
        const data = await fetchMedicalReports(selectedPatient.profile.userId);
        if (!active) return;
        setReports(data);
      } catch (e) {
        if (!active) return;
        setReportsError(e?.message || "Unable to load medical reports.");
      } finally {
        if (active) setReportsLoading(false);
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [selectedPatient]);

  // Whether any patients exist for display
  const hasPatients = doctorPatients.length > 0;

  // Prefetch user-service profiles for patients to show full names
  useEffect(() => {
    const missingUserIds = doctorPatients
      .map(p => p.userId)
      .filter(userId => !userProfiles[userId]);
    if (missingUserIds.length === 0) return;

    Promise.all(
      missingUserIds.map(userId =>
        fetchUserProfile(userId)
          .then(profile => ({ userId, profile }))
          .catch(() => ({ userId, profile: null }))
      )
    ).then(results => {
      setUserProfiles(prev => {
        const updated = { ...prev };
        results.forEach(({ userId, profile }) => {
          updated[userId] = profile;
        });
        return updated;
      });
    });
  }, [doctorPatients, userProfiles]);

  // left side patient list and right details/reports panel
  return (
    <div className="space-y-4" style={{ fontSize: "15px" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Patient Reports
          </h1>
          <p className="text-sm text-slate-500">
            View patient profiles and uploaded reports for your confirmed appointments.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left: list of patients with confirmed appointments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Patients
            </h2>
            <input
              type="search"
              aria-label="Search patients by name"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patient name"
              className="ml-3 w-48 rounded-lg border border-slate-300 px-2 py-1 text-sm shadow-sm"
            />
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Loading patients...</p>
          ) : !hasPatients ? (
            <p className="text-sm text-slate-600">
              No patients found for your confirmed appointments yet.
            </p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredDoctorPatients.map((p) => {
                const isSelected = p.userId === selectedPatientUserId;
                const lastApptTime = p.lastAppointment?.startTime
                  ? new Date(p.lastAppointment.startTime).toLocaleString()
                  : "N/A";

                return (
                  <li key={p.userId}>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientUserId(p.userId)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${isSelected
                        ? "border-sky-500 bg-sky-50/80 text-slate-900"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {userProfiles[p.userId]?.fullName || p.userId}
                            {/* {userProfile?.fullName || p.userId} */}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Last appointment: {lastApptTime}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.appointments.length} appt(s)
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: details and reports for the selected patient */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          {!selectedPatient ? (
            <p className="text-sm text-slate-600">
              Select a patient on the left to view profile and reports.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {userProfiles[selectedPatient.userId]?.fullName || selectedPatient.userId}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    User ID: {selectedPatient.userId}
                  </p>
                </div>
                <div className="text-xs text-slate-500 text-right">
                  Total appointments: {selectedPatient.appointments.length}
                </div>
              </div>

              {/* Basic profile snapshot from patient-service */}
              {selectedPatient.profile ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                  <div>
                    <span className="font-semibold">Gender:</span>{" "}
                    {selectedPatient.profile.gender || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Birth date:</span>{" "}
                    {selectedPatient.profile.birthDay
                      ? new Date(
                        selectedPatient.profile.birthDay,
                      ).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Blood group:</span>{" "}
                    {selectedPatient.profile.bloodGroup || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Address:</span>{" "}
                    {selectedPatient.profile.address?.line || "-"},{" "}
                    {selectedPatient.profile.address?.city || "-"},{" "}
                    {selectedPatient.profile.address?.country || "-"}
                  </div>
                 <div>
                    <span className="font-semibold">Medical History:</span>{" "}
                    {selectedPatient.profile.medicalHistory?.join(",  ") || "N/A"}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No profile info found in patient service for this user yet.
                </p>
              )}

              {/* Appointment history for this patient with the doctor */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  Appointment History
                </h3>
                {selectedPatient.appointments.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No appointments recorded.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">
                            Date &amp; time
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Queue
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPatient.appointments.map((a) => (
                          <tr key={a._id} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5">
                              {a.startTime
                                ? new Date(a.startTime).toLocaleString()
                                : "N/A"}
                            </td>
                            <td className="px-3 py-1.5">
                              {typeof a.queueNumber === "number"
                                ? `#${a.queueNumber}`
                                : "N/A"}
                            </td>
                            <td className="px-3 py-1.5 capitalize">
                              {a.status || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Medical reports list from patient-service for this patient */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  Uploaded Medical Reports
                </h3>
                {reportsError ? (
                  <p className="text-xs text-rose-600">{reportsError}</p>
                ) : reportsLoading ? (
                  <p className="text-xs text-slate-500">Loading reports...</p>
                ) : reports.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No medical reports uploaded for this patient yet.
                  </p>
                ) : (
                  <ul className="space-y-1 max-h-40 overflow-y-auto pr-1 text-xs text-slate-700">
                    {reports.map((r) => (
                      <li
                        key={r._id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <a
                            href={r.file?.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-700 hover:underline font-semibold block truncate"
                          >
                            {r.title || r.file?.url || "Open report"}
                          </a>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {r.reportType && (
                              <div className="truncate">{r.reportType}</div>
                            )}
                            {r.diagnosis && (
                              <div className="truncate">Diagnosis: {r.diagnosis}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 whitespace-nowrap ml-3">
                          {r.uploadedAt ? new Date(r.uploadedAt).toLocaleString() : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
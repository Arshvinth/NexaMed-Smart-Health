import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

// const DEV_AUTH = {
//   userId: process.env.REACT_APP_DOCTOR_USER_ID || "doc1",
//   role: "DOCTOR",
//   verificationStatus: process.env.REACT_APP_DOCTOR_VERIFICATION_STATUS || "VERIFIED",
// };

function getAuthHeaders() {  
  const userDetails = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem("token");

  const storedUserId = userDetails?.id || localStorage.getItem("x-user-id");
  const storedRole = userDetails?.role || localStorage.getItem("x-role");
  const storedVerification = userDetails?.verificationStatus || localStorage.getItem("x-verification-status");

  return {
    "authorization": `Bearer ${token}`,
    "x-user-id": storedUserId ,
    "x-role": storedRole,
    "x-verification-status": storedVerification
  };
}

async function fetchJson(path) {
  const response = await fetch(`${API_GATEWAY_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  }).catch((err) => {
    console.error("Network error while fetching", path, err);
    throw new Error(`Network error: ${err.message}`);
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch (e) {
      // Ignore JSON parse errors and keep fallback message.
    }
    throw new Error(`${response.status}: ${message}`);
  }

  return response.json();
}

async function loadDashboardData() {
  const [profileResult, availabilityResult, prescriptionsResult] = await Promise.allSettled([
    fetchJson("/api/doctors/me/profile"),
    fetchJson("/api/doctors/me/availability"),
    fetchJson("/api/prescriptions"),
  ]);

  console.log("Dashboard data results:", { profileResult, availabilityResult, prescriptionsResult });

  //retrieve logged in doctor details from local storage
  const userDetails = JSON.parse(localStorage.getItem('user'));
  console.log("Retrieved user details from localStorage:", userDetails);

  return {
    doctorDetail: userDetails || null,
    profile: profileResult.status === "fulfilled" ? profileResult.value : null,
    availability:
      availabilityResult.status === "fulfilled" && Array.isArray(availabilityResult.value)
        ? availabilityResult.value
        : [],
    prescriptions:
      prescriptionsResult.status === "fulfilled" && Array.isArray(prescriptionsResult.value)
        ? prescriptionsResult.value
        : [],
    failures: [profileResult, availabilityResult, prescriptionsResult].filter(
      (result) => result.status === "rejected"
    ),
  };
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [doctorDetail, setDoctorDetail] = useState(null);

  const loadDashboard = useCallback(async ({ background = false } = {}) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await loadDashboardData();

      if (result.profile) {
        setProfile(result.profile);
      }

      setAvailability(result.availability);
      setPrescriptions(result.prescriptions);
      setDoctorDetail(result.doctorDetail);
      setLastSyncedAt(new Date());

      if (result.failures.length) {
        const firstError = result.failures[0].reason;
        setError(firstError?.message || "Some dashboard data could not be loaded.");
      }
    } catch (e) {
      setError(e?.message || "Unable to load dashboard data.");
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const now = Date.now();
  const upcomingAvailability = useMemo(
    () =>
      availability.filter((slot) => {
        const start = new Date(slot.startTime).getTime();
        return Number.isFinite(start) && start >= now;
      }).length,
    [availability, now]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Doctor Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            {loading
              ? "Loading your latest profile and activity..."
              : `Welcome${profile?.fullName ? `, ${profile.fullName}` : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboard({ background: true })}
          disabled={loading || refreshing}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {lastSyncedAt ? (
        <p className="text-xs text-slate-500">Last synced: {lastSyncedAt.toLocaleString()}</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Verification"
          value={doctorDetail?.verificationStatus || "Unknown"}
          desc="Current account verification state"
        />
        <MetricCard
          title="Availability Slots"
          value={availability.length}
          desc={`${upcomingAvailability} upcoming slots`}
        />
        <MetricCard
          title="Prescriptions"
          value={prescriptions.length}
          desc="Total prescriptions issued"
        />
        <MetricCard
          title="Consultation Fee"
          value={typeof profile?.fee === "number" ? `Rs. ${profile.fee}` : "Not set"}
          desc="Fee configured in your profile"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Profile Snapshot</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <Row label="Name" value={profile?.fullName || "Not updated"} />
            <Row label="Specialization" value={profile?.specialization || "Not updated"} />
            <Row label="Experience" value={formatYears(profile?.experienceYears)} />
            <Row label="Registration No." value={profile?.registrationNo || "Not updated"} />
          </div>
          <Link
            to="/doctor/profile"
            className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:underline"
          >
            Update profile
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionLink to="/doctor/availability" title="Manage Availability" desc="Set schedule and slots" />
            <ActionLink to="/doctor/requests" title="Appointment Requests" desc="Accept or reject bookings" />
            <ActionLink to="/doctor/consult" title="Consultation Room" desc="Join live sessions" />
            <ActionLink
              to="/doctor/prescriptions"
              title="Issue Prescription"
              desc="Create and share e-prescriptions"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, desc }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-sm transition">
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
      <div className="text-sm text-slate-600 mt-1">{desc}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right">{value}</span>
    </div>
  );
}

function ActionLink({ to, title, desc }) {
  return (
    <Link to={to} className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-sm text-slate-600 mt-1">{desc}</div>
    </Link>
  );
}

function formatYears(value) {
  if (typeof value !== "number") return "Not updated";
  if (value === 0) return "0 years";
  if (value === 1) return "1 year";
  return `${value} years`;
}
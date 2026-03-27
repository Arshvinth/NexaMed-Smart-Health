import React, { useCallback, useEffect, useMemo, useState } from "react";

const DOCTOR_API_BASE_URL =
  process.env.REACT_APP_DOCTOR_SERVICE_URL || "http://localhost:5003";

const DEV_AUTH = {
  userId: process.env.REACT_APP_DOCTOR_USER_ID || "doc1",
  role: "DOCTOR",
  verificationStatus: process.env.REACT_APP_DOCTOR_VERIFICATION_STATUS || "VERIFIED",
};

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  specialization: "",
  registrationNo: "",
  experienceYears: "0",
  fee: "0",
  bio: "",
};

function getAuthHeaders() {
  const storedUserId = localStorage.getItem("x-user-id");
  const storedRole = localStorage.getItem("x-role");
  const storedVerification = localStorage.getItem("x-verification-status");

  return {
    "x-user-id": storedUserId || DEV_AUTH.userId,
    "x-role": storedRole || DEV_AUTH.role,
    "x-verification-status": storedVerification || DEV_AUTH.verificationStatus,
  };
}

function mapProfileToForm(profile) {
  if (!profile) return INITIAL_FORM;

  return {
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    specialization: profile.specialization || "",
    registrationNo: profile.registrationNo || "",
    experienceYears:
      typeof profile.experienceYears === "number" ? String(profile.experienceYears) : "0",
    fee: typeof profile.fee === "number" ? String(profile.fee) : "0",
    bio: profile.bio || "",
  };
}

function buildPayload(form) {
  return {
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
    specialization: form.specialization.trim(),
    registrationNo: form.registrationNo.trim(),
    experienceYears: Number(form.experienceYears || 0),
    fee: Number(form.fee || 0),
    bio: form.bio.trim(),
  };
}

async function readError(response) {
  try {
    const body = await response.json();
    return body?.message || "Request failed";
  } catch (e) {
    return "Request failed";
  }
}

export default function Profile() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [verificationStatus, setVerificationStatus] = useState("Unknown");
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async ({ background = false } = {}) => {
    if (background) {
      setReloading(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch(`${DOCTOR_API_BASE_URL}/api/doctors/me/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const message = await readError(response);
        throw new Error(`${response.status}: ${message}`);
      }

      const data = await response.json();
      setForm(mapProfileToForm(data));
      setVerificationStatus(data?.verificationStatus || "Unknown");
    } catch (e) {
      setError(e?.message || "Unable to load profile.");
    } finally {
      if (background) {
        setReloading(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isValid = useMemo(() => {
    return (
      form.fullName.trim() &&
      form.specialization.trim() &&
      form.registrationNo.trim() &&
      Number(form.experienceYears) >= 0 &&
      Number(form.fee) >= 0
    );
  }, [form]);

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSuccess("");

    if (!isValid) {
      setError("Please complete required fields and use non-negative numbers.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${DOCTOR_API_BASE_URL}/api/doctors/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(buildPayload(form)),
      });

      if (!response.ok) {
        const message = await readError(response);
        throw new Error(`${response.status}: ${message}`);
      }

      const updated = await response.json();
      setForm(mapProfileToForm(updated));
      setVerificationStatus(updated?.verificationStatus || verificationStatus);
      setSuccess("Profile updated successfully.");
    } catch (e) {
      setError(e?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">Doctor Profile</h1>
          <p className="mt-2 text-slate-600">Manage your professional details.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Verification: {verificationStatus}
          </span>
          <button
            type="button"
            onClick={() => loadProfile({ background: true })}
            disabled={loading || saving || reloading}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {reloading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          required
          disabled={loading || saving}
          placeholder="Dr. Jane Smith"
        />

        <Field
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={onChange}
          disabled={loading || saving}
          placeholder="+94 7X XXX XXXX"
        />

        <Field
          label="Specialization"
          name="specialization"
          value={form.specialization}
          onChange={onChange}
          required
          disabled={loading || saving}
          placeholder="Cardiology"
        />

        <Field
          label="Registration No."
          name="registrationNo"
          value={form.registrationNo}
          onChange={onChange}
          required
          disabled={loading || saving}
          placeholder="SLMC-12345"
        />

        <Field
          label="Experience (Years)"
          type="number"
          min="0"
          name="experienceYears"
          value={form.experienceYears}
          onChange={onChange}
          disabled={loading || saving}
        />

        <Field
          label="Consultation Fee"
          type="number"
          min="0"
          name="fee"
          value={form.fee}
          onChange={onChange}
          disabled={loading || saving}
        />

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={onChange}
            disabled={loading || saving}
            rows={5}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            placeholder="Briefly describe your background and care approach"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || saving || !isValid}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {loading ? <span className="text-sm text-slate-500">Loading current profile...</span> : null}
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, required, disabled, placeholder, ...rest }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <input
        {...rest}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
      />
    </label>
  );
}
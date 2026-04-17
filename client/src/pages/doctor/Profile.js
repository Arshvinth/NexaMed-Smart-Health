import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../../utils/userAuth";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

// Initial form shape used for the profile editor
const INITIAL_FORM = {
  fullName: "",
  phone: "",
  specialization: "",
  registrationNo: "",
  experienceYears: "0",
  fee: "0",
  bio: "",
};

// map API profile object to local form representationrefix)
function mapProfileToForm(profile) {
  if (!profile) return INITIAL_FORM;

  const rawName = profile.fullName || "";
  const withoutPrefix = rawName.replace(/^Dr\.?\s*/i, "").trim();

  return {
    fullName: withoutPrefix,
    phone: profile.phone || "",
    specialization: profile.specialization || "",
    registrationNo: profile.registrationNo || "",
    experienceYears:
      typeof profile.experienceYears === "number" ? String(profile.experienceYears) : "0",
    fee: typeof profile.fee === "number" ? String(profile.fee) : "0",
    bio: profile.bio || "",
  };
}

// Helper: build API payload from form values (adds Dr. prefix to name)
function buildPayload(form) {
  const trimmedName = form.fullName.trim();
  const fullNameWithPrefix = trimmedName ? `Dr. ${trimmedName}` : "";
  return {
    fullName: fullNameWithPrefix,
    phone: form.phone.trim(),
    specialization: form.specialization.trim(),
    registrationNo: form.registrationNo.trim(),
    experienceYears: Number(form.experienceYears || 0),
    fee: Number(form.fee || 0),
    bio: form.bio.trim(),
  };
}

// Helper: read error message from fetch response safely
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
  const [editMode, setEditMode] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load profile from API, supports background refresh mode
  const loadProfile = useCallback(async ({ background = false } = {}) => {
    if (background) {
      setReloading(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/doctors/me/profile`, {
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
      setEditMode(false);
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

  // Initial load on component mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Compute form validity used to enable Save button
  const isValid = useMemo(() => {
    const phone = form.phone.trim();
    const phonePattern = /^\+94\d{9}$/;
    const phoneOk = phonePattern.test(phone);

    return (
      form.fullName.trim() &&
      form.specialization.trim() &&
      form.registrationNo.trim() &&
      phoneOk &&
      Number(form.experienceYears) >= 0 &&
      Number(form.fee) >= 0
    );
  }, [form]);

  // Handle form field changes and inline validation for phone
  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

     if (name === "phone") {
       const phone = value.trim();
       const phonePattern = /^\+94\d{9}$/;
       setFieldErrors((prev) => ({
         ...prev,
         phone: phone && !phonePattern.test(phone)
           ? "Phone must be in format +94 followed by 9 digits."
           : "",
       }));
     }
  }

  // Submit handler: validate and send profile update to API
  async function onSubmit(event) {
    event.preventDefault();
    setSuccess("");

    if (!isValid) {
      setError(
        "Please complete all required fields, ensure phone is in format +94XXXXXXXXX, and use non-negative numbers.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/doctors/me/profile`, {
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
      setEditMode(false);
    } catch (e) {
      setError(e?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  // Render profile editor form and status badges
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
          <button
            type="button"
            onClick={() => {
              setEditMode((prev) => !prev);
              setSuccess("");
              setError("");
            }}
            disabled={loading || saving}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {editMode ? "Cancel Edit" : "Edit"}
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
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Full Name<span className="text-rose-500"> *</span>
          </span>
          <div className="mt-1 flex items-center gap-1">
            <span className="rounded-l-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Dr.
            </span>
            <input
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              required
              disabled={loading || saving || !editMode}
              placeholder="Jane Smith"
              className="w-full rounded-r-xl border border-l-0 border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
        </label>

        <Field
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={onChange}
          required
          disabled={loading || saving || !editMode}
          placeholder="+947XXXXXXXX"
          error={fieldErrors.phone}
        />

        <Field
          label="Specialization"
          name="specialization"
          value={form.specialization}
          onChange={onChange}
          required
          disabled={loading || saving || !editMode}
          placeholder="Cardiology"
        />

        <Field
          label="Registration No."
          name="registrationNo"
          value={form.registrationNo}
          onChange={onChange}
          required
          disabled={loading || saving || !editMode}
          placeholder="SLMC-12345"
        />

        <Field
          label="Experience (Years)"
          type="number"
          min="0"
          name="experienceYears"
          value={form.experienceYears}
          onChange={onChange}
          disabled={loading || saving || !editMode}
        />

        <Field
          label="Consultation Fee"
          type="number"
          min="0"
          name="fee"
          value={form.fee}
          onChange={onChange}
          disabled={loading || saving || !editMode}
        />

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={onChange}
            disabled={loading || saving || !editMode}
            rows={5}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            placeholder="Briefly describe your background and care approach"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 pt-2">
          {editMode ? (
            <button
              type="submit"
              disabled={loading || saving || !isValid}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          ) : null}
          {loading ? (
            <span className="text-sm text-slate-500">Loading current profile...</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, required, disabled, placeholder, error, ...rest }) {
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
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : null}
    </label>
  );
}
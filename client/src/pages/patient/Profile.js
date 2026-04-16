import React, { useState, useEffect } from "react";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_GATEWAY_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

  function getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("x-user-id") || "P0001",
      "x-role": "PATIENT",
      "x-verification-status": "VERIFIED",
    };
  }

  const [formData, setFormData] = useState({
    birthDay: "",
    gender: "",
    address: { line: "", city: "", country: "" },
    medicalHistory: [],
    bloodGroup: "",
    currentMedication: []
  });

  const fetchProfile = async () => {
    try {
      const userId = localStorage.getItem('x-user-id') || 'P0001';
      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/patients/profile/${userId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setProfile(data.data);
      setFormData({
        birthDay: data.data.birthDay?.split('T')[0] || "",
        gender: data.data.gender || "",
        address: data.data.address || { line: "", city: "", country: "" },
        medicalHistory: data.data.medicalHistory || [],
        bloodGroup: data.data.bloodGroup || "",
        currentMedication: data.data.currentMedication || []
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userId = localStorage.getItem('x-user-id') || 'P0001';
      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/patients/profile/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      setProfile(data.data);
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({ ...formData, [field]: items });
  };

  if (loading && !profile) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        <p className="mt-2 text-slate-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-extrabold">Patient Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        {!editing ? (
          // View Mode
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-600">User ID</label>
                <p className="text-slate-900">{profile?.userId || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Birth Date</label>
                <p className="text-slate-900">{profile?.birthDay ? new Date(profile.birthDay).toLocaleDateString() : "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Gender</label>
                <p className="text-slate-900">{profile?.gender || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Blood Group</label>
                <p className="text-slate-900">{profile?.bloodGroup || "N/A"}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">Address</label>
              <p className="text-slate-900">
                {profile?.address?.line && `${profile.address.line}, `}
                {profile?.address?.city && `${profile.address.city}, `}
                {profile?.address?.country || "N/A"}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">Medical History</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.medicalHistory?.length > 0 ? (
                  profile.medicalHistory.map((item, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">No medical history recorded</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">Current Medication</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.currentMedication?.length > 0 ? (
                  profile.currentMedication.map((item, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500">No current medication</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Birth Date</label>
                <input
                  type="date"
                  value={formData.birthDay}
                  onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group</label>
                <input
                  type="text"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  placeholder="e.g., A+, B-, O+"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Address Line</label>
              <input
                type="text"
                value={formData.address.line}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line: e.target.value } })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Medical History (comma-separated)
              </label>
              <input
                type="text"
                value={formData.medicalHistory.join(', ')}
                onChange={(e) => handleArrayInput('medicalHistory', e.target.value)}
                placeholder="e.g., Diabetes, Hypertension, Asthma"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Current Medication (comma-separated)
              </label>
              <input
                type="text"
                value={formData.currentMedication.join(', ')}
                onChange={(e) => handleArrayInput('currentMedication', e.target.value)}
                placeholder="e.g., Paracetamol, Amoxicillin"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  fetchProfile();
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
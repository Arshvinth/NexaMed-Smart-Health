import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

function authHeader() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export async function getPendingDoctors() {
  const res = await axios.get(`${API_BASE_URL}/api/admin/doctors/pending`, {
    headers: authHeader(),
  });
  return res.data;
}

export async function updateDoctorStatus(userId, status) {
  const res = await axios.patch(
    `${API_BASE_URL}/api/admin/doctors/${userId}/verification-status`,
    { status }, // VERIFIED | REJECTED
    { headers: authHeader() }
  );
  return res.data;
}
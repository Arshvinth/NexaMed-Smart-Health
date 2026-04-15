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
    { status },
    { headers: authHeader() }
  );
  return res.data;
}

export async function getUsers({ page = 1, limit = 10, q = "", role = "" } = {}) {
  const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
    headers: authHeader(),
    params: { page, limit, q, role },
  });
  return res.data; // { items, page, limit, total, totalPages }
}

export async function createUser(payload) {
  const res = await axios.post(`${API_BASE_URL}/api/admin/users`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

export async function updateUser(userId, payload) {
  const res = await axios.patch(`${API_BASE_URL}/api/admin/users/${userId}`, payload, {
    headers: authHeader(),
  });
  return res.data;
}

export async function deleteUser(userId) {
  const res = await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
    headers: authHeader(),
  });
  return res.data;
}
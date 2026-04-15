import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

export async function signupUser({ role, fullName, email, password }) {
  const endpoint =
    role === "doctor" ? "/api/auth/register/doctor" : "/api/auth/register/patient";

  const res = await axios.post(`${API_BASE_URL}${endpoint}`, {
    fullName,
    email,
    password,
  });

  return res.data; // { user, token }
}

export async function loginUser({ email, password }) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email,
    password,
  });
  return res.data; // { user, token }
}
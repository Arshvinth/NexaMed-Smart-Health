import axios from "axios";

const gatewayUrl =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: gatewayUrl,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

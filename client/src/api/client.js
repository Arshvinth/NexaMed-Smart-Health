import axios from "axios";

const gatewayUrl =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: gatewayUrl,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to add token and user headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.userId) config.headers["x-user-id"] = user.userId;
      if (user.role) config.headers["x-role"] = user.role;
      if (user.verificationStatus)
        config.headers["x-verification-status"] = user.verificationStatus;
    } catch (e) {}
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

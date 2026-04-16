export function getAuthHeaders() {
  const userDetails = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "x-user-id": userDetails.userId || localStorage.getItem("x-user-id"),
    "x-role": userDetails.role || localStorage.getItem("x-role"),
    "x-verification-status":
      userDetails.verificationStatus ||
      localStorage.getItem("x-verification-status"),
  };
}

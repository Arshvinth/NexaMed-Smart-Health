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
    "x-verification-status": storedVerification,
    "Content-Type": "application/json"
  };
}

export { getAuthHeaders };
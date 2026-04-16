import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import logoMark from "../../assets/NexaMed.svg";
import { logoutUser } from "../../api/authApi";

export default function Topbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role =
    pathname.startsWith("/doctor")
      ? "Doctor"
      : pathname.startsWith("/admin")
        ? "Admin"
        : "Patient";

  const handleLogout = async () => {
    try { await logoutUser(); } catch (e) { }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center overflow-hidden h-9 w-9 rounded-xl bg-slate-900 logo-glow">
            <img
              src={logoMark}
              alt="NexaMed logo"
              className="h-7 w-7"
            />
          </div>
          <div>
            <div className="font-bold text-slate-900">{role} Dashboard</div>
            <div className="text-xs text-slate-500">UI-only navigation</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-3 py-2 text-sm rounded-lg text-slate-700 hover:bg-slate-100"
          >
            Back to Home
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 text-sm border rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
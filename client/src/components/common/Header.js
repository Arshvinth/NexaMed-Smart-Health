import React from "react";
import { Link, NavLink } from "react-router-dom";
import logoMark from "../../assets/NexaMed.svg";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden logo-glow group-hover:scale-105 transition-transform">
            <img
              src={logoMark}
              alt="NexaMed logo"
              className="h-7 w-7"
            />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold tracking-tight">NexaMed</div>
            <div className="text-xs text-slate-500">Telemedicine Platform</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm ${
                isActive
                  ? "text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            Home
          </NavLink>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
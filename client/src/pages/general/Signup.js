import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  const [role, setRole] = useState("patient");

  function onSubmit(e) {
    e.preventDefault();
    alert("UI-only signup. Later connect to backend.");
  }

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-xl px-4 py-10 md:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-600">
            UI-only signup (backend integration later).
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Full name
              </label>
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <button className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800">
              Sign up
            </button>

            <div className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-sky-700 hover:underline"
              >
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ROLES = [
  { value: "patient", label: "Patient" },
  { value: "doctor", label: "Doctor" },
  { value: "admin", label: "Admin" },
];

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectPath = useMemo(() => {
    if (role === "doctor") return "/doctor";
    if (role === "admin") return "/admin";
    return "/patient";
  }, [role]);

  function onSubmit(e) {
    e.preventDefault();
    // UI-only login
    navigate(redirectPath);
  }

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Login
              </h1>
              <p className="mt-3 text-slate-600">
                Choose a role and continue to the dashboard. Authentication will
                be integrated later.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <InfoChip title="Patient" desc="Book & manage appointments" />
                <InfoChip title="Doctor" desc="Consultations & prescriptions" />
                <InfoChip title="Admin" desc="Verify doctors & transactions" />
                <InfoChip title="AI" desc="Optional symptom checker" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-600">
              UI-only login (role-based routing).
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 shadow-sm"
              >
                Login & go to dashboard
              </button>

              <div className="text-sm text-slate-600">
                Don’t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-sky-700 hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </form>

            <div className="mt-4 text-xs text-slate-500">
              Later: connect to Auth microservice and store JWT.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ title, desc }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-sm text-slate-600 mt-1">{desc}</div>
    </div>
  );
}
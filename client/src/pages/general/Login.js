import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authApi";

export default function Login() {
  const navigate = useNavigate();

  const ROLES = useMemo(
    () => [
      { value: "PATIENT", label: "Patient" },
      { value: "DOCTOR", label: "Doctor" },
      { value: "ADMIN", label: "Admin" },
      { value: "AI", label: "AI (optional)" },
    ],
    []
  );

  const [role, setRole] = useState("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getRedirectPath(user) {
    if (user?.role === "DOCTOR") return "/doctor";
    if (user?.role === "ADMIN") return "/admin";
    return "/patient";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      // If your backend expects role, keep it in the payload.
      // If it doesn't, you can remove `role` safely.
      const data = await loginUser({ email, password, role });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate(getRedirectPath(data.user));
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50">
      <div className="max-w-6xl px-4 py-10 mx-auto md:py-14">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Left info panel (from file 1, plus file 2 text) */}
          <div className="hidden md:block">
            <div className="p-8 bg-white border shadow-sm rounded-2xl border-slate-200">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Login
              </h1>

              <p className="mt-3 text-slate-600">
                Login with your account to access your dashboard. Choose a role
                and continue.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <InfoChip title="Patient" desc="Book & manage appointments" />
                <InfoChip title="Doctor" desc="Consultations & prescriptions" />
                <InfoChip title="Admin" desc="Verify doctors & transactions" />
                <InfoChip title="AI" desc="Optional symptom checker" />
              </div>
            </div>
          </div>

          {/* Right form panel (merged) */}
          <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200 md:p-8">
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sign in to continue.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {/* Role select (from file 1, fixed) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email (use type=email from file 2) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="name@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              {/* Error (from file 2; file 1 didn’t render it) */}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              {/* Button (merged: file 1 text + file 2 loading/disabled) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 font-semibold text-white shadow-sm rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login & go to dashboard"}
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
              JWT is stored in localStorage for now. Later: connect fully to the
              Auth microservice (refresh tokens, httpOnly cookies, etc.).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ title, desc }) {
  return (
    <div className="p-4 border rounded-xl border-slate-200">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}
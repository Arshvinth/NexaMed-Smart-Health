import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../../api/authApi";

const API_GATEWAY_BASE_URL =
  process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

export default function Signup() {
  const [role, setRole] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      const data = await signupUser({ role, fullName, email, password });

      // store auth for next pages
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // If the signed-up user is a patient, create a patient profile via API gateway
      if (data.user.role === "PATIENT") {
        try {
          const resp = await fetch(`${API_GATEWAY_BASE_URL}/api/patients/addPatient`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              birthDay: "NULL"
            }),
          });
          console.log("Patient profile creation response:", resp);
          navigate("/patient");
        } catch (e) {
          console.error("Failed to create patient profile:", e);
        }
      }
      else if (data.user.role === "DOCTOR") {
        // Call doctor-service to create doctor profile
        console.log(`API Gateway Base URL: ${API_GATEWAY_BASE_URL}`);
        console.log("Signup response data:", data.user);
        const response = await fetch(`${API_GATEWAY_BASE_URL}/api/doctors/addDoctor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            fullName: data.user.fullName,
            specialization: "NULL",
            registrationNo: "NULL"
          })
        });
        console.log("Doctor profile creation response:", response);
        navigate("/doctor");
      }
      else navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50">
      <div className="max-w-xl px-4 py-10 mx-auto md:py-14">
        <div className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200 md:p-8">
          <h2 className="text-xl font-bold text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create your NexaMed account.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Role</label>
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
              <label className="block text-sm font-semibold text-slate-700">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              disabled={loading}
              className="w-full px-4 py-3 font-semibold text-white rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Sign up"}
            </button>

            <div className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-sky-700 hover:underline">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
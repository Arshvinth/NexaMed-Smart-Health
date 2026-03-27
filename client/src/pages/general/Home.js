import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-slate-50 via-sky-50/40 to-white">
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 hero-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/70 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Smarter care for patients, doctors & clinics
            </p>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Smart Healthcare,{" "}
              <span className="text-sky-600">Appointments</span> & Telemedicine
            </h1>

            <p className="text-slate-600 text-lg max-w-xl">
              Browse doctors, book appointments, join video consultations, upload
              reports, and get AI-based preliminary suggestions.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="px-6 py-3 rounded-xl bg-sky-600 text-white font-semibold shadow-sm hover:bg-sky-700 hover:-translate-y-0.5 hover:shadow-md transition-transform"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm transition-transform"
              >
                Login
              </Link>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-3 hero-fade-up-delay">
              <Feature title="Appointments" desc="Search by specialty & book." />
              <Feature title="Video Consults" desc="Secure real-time sessions." />
              <Feature title="Reports" desc="Upload & manage documents." />
              <Feature title="AI Checker" desc="Optional symptom assistant." />
            </div>
          </div>

          <div className="relative hero-fade-up-delay">
            <div className="absolute -inset-4 blur-2xl opacity-60 bg-gradient-to-r from-sky-200 via-indigo-200 to-emerald-200 rounded-3xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-white/90 shadow-xl p-6 card-float-slow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">Next appointment</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    Dr. Silva — Cardiology
                  </div>
                  <div className="text-sm text-slate-600">Today 5:30 PM</div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  Confirmed
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <MiniStat label="Doctors" value="120+" />
                <MiniStat label="Specialties" value="25+" />
                <MiniStat label="Reports" value="Secure" />
                <MiniStat label="Payments" value="Sandbox" />
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 p-4 bg-slate-50 card-float-delay">
                <div className="text-sm font-semibold text-slate-900">Tip</div>
                <div className="text-sm text-slate-600 mt-1">
                  Upload reports before consultation for faster diagnosis.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-sm text-slate-600 mt-1">{desc}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
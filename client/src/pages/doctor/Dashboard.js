import React from "react";

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-extrabold">Doctor Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Availability" desc="Set your schedule." />
        <Card title="Requests" desc="Accept / Reject appointments." />
        <Card title="Consultations" desc="Join video sessions." />
        <Card title="Prescriptions" desc="Issue digital prescriptions." />
      </div>
    </div>
  );
}

function Card({ title, desc }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-sm transition">
      <div className="font-bold">{title}</div>
      <div className="text-sm text-slate-600 mt-1">{desc}</div>
    </div>
  );
}
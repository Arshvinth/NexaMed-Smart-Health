import React from "react";

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <Header title="Patient Dashboard" subtitle="Overview of your activity" />
      <Grid>
        <Card title="Book Appointment" desc="Search doctors & reserve a time slot." />
        <Card title="Upload Reports" desc="Upload medical reports and documents." />
        <Card title="Prescriptions" desc="View past prescriptions." />
        <Card title="Video Consultation" desc="Join a telemedicine session." />
      </Grid>
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-1 text-slate-600">{subtitle}</p>
    </div>
  );
}
function Grid({ children }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>;
}
function Card({ title, desc }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-sm transition">
      <div className="font-bold">{title}</div>
      <div className="text-sm text-slate-600 mt-1">{desc}</div>
    </div>
  );
}
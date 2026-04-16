import React from "react";

export default function UsageMetricsCards({ metrics }) {
  const cards = [
    { label: "New Appointments", value: metrics?.newAppointments ?? 0 },
    { label: "Completed", value: metrics?.completedAppointments ?? 0 },
    { label: "Cancelled", value: metrics?.cancelledAppointments ?? 0 },
    { label: "Payments Completed", value: metrics?.completedPayments ?? 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="p-5 bg-white border rounded-2xl border-slate-200">
          <div className="text-sm text-slate-600">{c.label}</div>
          <div className="mt-1 text-2xl font-extrabold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
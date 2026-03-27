import React from "react";
export default function MyAppointments() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">My Appointments</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          View/modify/cancel bookings and status (UI only).
        </p>
      </div>
    </div>
  );
}
import React from "react";
export default function BookAppointment() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Book Appointment</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          Search doctors by specialty + pick date/time (UI only).
        </p>
      </div>
    </div>
  );
}
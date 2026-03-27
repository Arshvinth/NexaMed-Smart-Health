import React from "react";
import { useParams } from "react-router-dom";

export default function IssuePrescription() {
  const { appointmentId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Issue Prescription</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          Appointment:{" "}
          <span className="font-semibold">{appointmentId || "(select one)"}</span>
        </p>
        <p className="mt-3 text-slate-600">UI-only prescription form later.</p>
      </div>
    </div>
  );
}
import React from "react";
import { useParams } from "react-router-dom";

export default function PatientReports() {
  const { patientId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Patient Reports</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          Patient: <span className="font-semibold">{patientId || "(select one)"}</span>
        </p>
        <p className="mt-3 text-slate-600">View uploaded reports (UI only).</p>
      </div>
    </div>
  );
}
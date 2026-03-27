import React from "react";
import { useParams } from "react-router-dom";

export default function ConsultationRoom() {
  const { sessionId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Consultation Room</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          Session: <span className="font-semibold">{sessionId || "(not selected)"}</span>
        </p>
        <div className="mt-4 aspect-video rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          Video API integration later
        </div>
      </div>
    </div>
  );
}
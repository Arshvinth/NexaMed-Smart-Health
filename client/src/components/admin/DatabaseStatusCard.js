import React from "react";

export default function DatabaseStatusCard({ mongoUp }) {
  return (
    <div className="p-5 bg-white border rounded-2xl border-slate-200">
      <h3 className="mb-2 font-bold text-slate-900">Database Status</h3>
      <div className={mongoUp ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
        {mongoUp ? "MongoDB: 🟢 UP" : "MongoDB: 🔴 DOWN"}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Current mode: inferred via service health.
      </p>
    </div>
  );
}
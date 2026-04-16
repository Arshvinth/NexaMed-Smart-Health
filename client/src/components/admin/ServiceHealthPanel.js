import React from "react";

export default function ServiceHealthPanel({ services = {} }) {
  const entries = Object.entries(services);
  return (
    <div className="p-5 bg-white border rounded-2xl border-slate-200">
      <h3 className="mb-3 font-bold text-slate-900">System Health</h3>
      <div className="space-y-2">
        {entries.map(([name, s]) => (
          <div key={name} className="flex items-center justify-between text-sm">
            <span className="text-slate-700">{name}</span>
            <span className={s.up ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
              {s.up ? "🟢 UP" : "🔴 DOWN"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
import React from "react";

export default function ActivityFeedTable({ items = [] }) {
  return (
    <div className="p-5 bg-white border rounded-2xl border-slate-200">
      <h3 className="mb-3 font-bold text-slate-900">Recent Appointment Activity</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full overflow-hidden border border-slate-200 rounded-xl">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left border-b">Appointment ID</th>
              <th className="p-3 text-left border-b">Doctor</th>
              <th className="p-3 text-left border-b">Status</th>
              <th className="p-3 text-left border-b">Start</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="p-3 text-slate-500">No activity found.</td></tr>
            ) : (
              items.map((a) => (
                <tr key={a._id} className="border-b">
                  <td className="p-3">{a._id}</td>
                  <td className="p-3">{a.doctorName || "-"}</td>
                  <td className="p-3">{a.status}</td>
                  <td className="p-3">{a.startTime ? new Date(a.startTime).toLocaleString() : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
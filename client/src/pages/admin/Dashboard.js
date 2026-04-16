import React, { useEffect, useState } from "react";
import { getPlatformOverview } from "../../api/adminApi";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "24h", label: "Last 24h" },
  { value: "week", label: "This Week" },
];

export default function Dashboard() {
  const [range, setRange] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [counts, setCounts] = useState({
    usersTotal: 0,
    pendingDoctorsCount: 0,
    completedPayments: 0,
    newAppointments: 0,
    cancelledAppointments: 0,
    completedAppointments: 0,
  });

  async function loadOverview(selectedRange = range) {
    try {
      setLoading(true);
      setError("");

      const data = await getPlatformOverview(selectedRange);
      const m = data?.usageMetrics || {};

      setCounts({
        usersTotal: m.usersTotal || 0,
        pendingDoctorsCount: m.pendingDoctorsCount || 0,
        completedPayments: m.completedPayments || 0,
        newAppointments: m.newAppointments || 0,
        cancelledAppointments: m.cancelledAppointments || 0,
        completedAppointments: m.completedAppointments || 0,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">Admin Dashboard</h1>

        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                range === r.value ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => loadOverview(range)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Total Users" desc="All registered users." value={counts.usersTotal} loading={loading} />
        <Card
          title="Pending Doctors"
          desc="Awaiting admin verification."
          value={counts.pendingDoctorsCount}
          loading={loading}
        />
        <Card
          title="Payments Completed"
          desc={`In selected range (${range}).`}
          value={counts.completedPayments}
          loading={loading}
        />
        <Card
          title="New Appointments"
          desc={`Created in selected range (${range}).`}
          value={counts.newAppointments}
          loading={loading}
        />
        <Card
          title="Completed Appointments"
          desc={`Finished in selected range (${range}).`}
          value={counts.completedAppointments}
          loading={loading}
        />
        <Card
          title="Cancelled Appointments"
          desc={`Cancelled in selected range (${range}).`}
          value={counts.cancelledAppointments}
          loading={loading}
        />
      </div>
    </div>
  );
}

function Card({ title, desc, value, loading }) {
  return (
    <div className="p-5 transition bg-white border rounded-2xl border-slate-200 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="font-bold">{title}</div>
        <div className="text-2xl font-extrabold text-slate-900">{loading ? "..." : value}</div>
      </div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}
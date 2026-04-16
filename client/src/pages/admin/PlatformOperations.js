import React, { useEffect, useState } from "react";
import { getPlatformOverview } from "../../api/adminApi";
import ServiceHealthPanel from "../../components/admin/ServiceHealthPanel";
import UsageMetricsCards from "../../components/admin/UsageMetricsCards";
import ActivityFeedTable from "../../components/admin/ActivityFeedTable";
import DatabaseStatusCard from "../../components/admin/DatabaseStatusCard";

export default function PlatformOperations() {
  const [range, setRange] = useState("24h");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await getPlatformOverview(range);
      setData(res);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load platform overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [range]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Platform Operations</h1>

      <div className="flex gap-2">
        {["today", "24h", "week"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg border ${range === r ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            {r}
          </button>
        ))}
        <button onClick={load} className="px-3 py-1.5 rounded-lg border bg-white">Refresh</button>
      </div>

      {loading ? <p>Loading...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {data && (
        <>
          <UsageMetricsCards metrics={data.usageMetrics} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ServiceHealthPanel services={data.serviceHealth} />
            <DatabaseStatusCard mongoUp={data.databaseStatus?.mongoUp} />
          </div>
          <ActivityFeedTable items={data.activityFeed || []} />
        </>
      )}
    </div>
  );
}
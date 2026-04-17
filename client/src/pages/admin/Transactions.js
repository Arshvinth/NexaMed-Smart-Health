import React, { useEffect, useState } from "react";
import { getPayments } from "../../api/adminApi";

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(nextPage = page) {
    try {
      setLoading(true);
      setError("");
      const data = await getPayments({
        page: nextPage,
        limit,
        q: q.trim(),
        status,
        fromDate,
        toDate,
      });
      setItems(data.items || []);
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e) {
    e.preventDefault();
    load(1);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Transactions</h1>

      <div className="p-6 space-y-4 bg-white border rounded-2xl border-slate-200">
        <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search appointment/patient/txn..."
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          >
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          />
          <button className="rounded-xl bg-sky-600 text-white px-4 py-2.5 font-semibold hover:bg-sky-700">
            Search
          </button>
        </form>

        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full overflow-hidden border border-slate-200 rounded-xl">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left border-b">Appointment</th>
                <th className="p-3 text-left border-b">Patient</th>
                <th className="p-3 text-left border-b">Amount</th>
                <th className="p-3 text-left border-b">Status</th>
                <th className="p-3 text-left border-b">Transaction</th>
                <th className="p-3 text-left border-b">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-3">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-3 text-slate-500">No transactions found.</td></tr>
              ) : (
                items.map((t) => (
                  <tr key={t._id} className="border-b">
                    <td className="p-3">{t.appointmentId}</td>
                    <td className="p-3">{t.patientUserId}</td>
                    <td className="p-3">${Number(t.amount || 0).toFixed(2)}</td>
                    <td className="p-3">{t.status}</td>
                    <td className="p-3">{t.transactionId || "-"}</td>
                    <td className="p-3">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Total: {total} | Page {page} of {totalPages}
          </div>
          <div className="space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../api/adminApi";

const ROLES = ["PATIENT", "DOCTOR", "ADMIN"];
const VERIFY_STATUSES = ["PENDING", "VERIFIED", "REJECTED"];

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "PATIENT",
  verificationStatus: "VERIFIED",
};

export default function Users() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [createLoading, setCreateLoading] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "PATIENT",
    verificationStatus: "VERIFIED",
  });
  const [editLoading, setEditLoading] = useState(false);

  async function loadUsers(nextPage = page) {
    try {
      setLoading(true);
      setError("");
      const data = await getUsers({
        page: nextPage,
        limit,
        q: q.trim(),
        role: roleFilter,
      });

      setItems(data.items || []);
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e) {
    e.preventDefault();
    await loadUsers(1);
  }

  async function onCreate(e) {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await createUser(createForm);
      setShowCreate(false);
      setCreateForm(initialForm);
      await loadUsers(1);
    } catch (err) {
      alert(err?.response?.data?.message || "Create failed");
    } finally {
      setCreateLoading(false);
    }
  }

  function openEditModal(user) {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "",
      role: user.role || "PATIENT",
      verificationStatus: user.verificationStatus || "VERIFIED",
    });
  }

  async function onEditSave(e) {
    e.preventDefault();
    if (!editUser) return;

    const payload = {
      fullName: editForm.fullName,
      email: editForm.email,
      role: editForm.role,
      verificationStatus: editForm.verificationStatus,
    };
    if (editForm.password) payload.password = editForm.password;

    try {
      setEditLoading(true);
      await updateUser(editUser.id, payload);
      setEditUser(null);
      await loadUsers(page);
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  }

  async function onDelete(user) {
    const ok = window.confirm(`Delete user "${user.fullName}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteUser(user.id);
      await loadUsers(page);
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Manage Users</h1>

      <div className="p-4 space-y-4 bg-white border md:p-6 rounded-2xl border-slate-200">
        <form onSubmit={onSearch} className="grid gap-3 md:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name/email..."
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-sky-600 text-white px-4 py-2.5 font-semibold hover:bg-sky-700">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-slate-900 text-white px-4 py-2.5 font-semibold hover:bg-slate-800"
          >
            + Create User
          </button>
        </form>

        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full overflow-hidden border border-slate-200 rounded-xl">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left border-b">Name</th>
                <th className="p-3 text-left border-b">Email</th>
                <th className="p-3 text-left border-b">Role</th>
                <th className="p-3 text-left border-b">Verification</th>
                <th className="p-3 text-left border-b">Created</th>
                <th className="p-3 text-left border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3">{u.fullName}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">{u.verificationStatus}</td>
                    <td className="p-3">{new Date(u.createdAt).toLocaleString()}</td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(u)}
                        className="rounded-lg bg-rose-600 text-white px-3 py-1.5 text-sm hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </td>
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
              onClick={() => loadUsers(page - 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => loadUsers(page + 1)}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)}>
          <form onSubmit={onCreate} className="space-y-3">
            <input
              placeholder="Full name"
              value={createForm.fullName}
              onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <input
              placeholder="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <input
              placeholder="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={createForm.verificationStatus}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, verificationStatus: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {VERIFY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              disabled={createLoading}
              className="w-full rounded-xl bg-slate-900 text-white px-4 py-2.5 font-semibold"
            >
              {createLoading ? "Creating..." : "Create User"}
            </button>
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Edit User: ${editUser.fullName}`} onClose={() => setEditUser(null)}>
          <form onSubmit={onEditSave} className="space-y-3">
            <input
              placeholder="Full name"
              value={editForm.fullName}
              onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <input
              placeholder="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <input
              placeholder="New password (optional)"
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={editForm.verificationStatus}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, verificationStatus: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {VERIFY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              disabled={editLoading}
              className="w-full rounded-xl bg-sky-600 text-white px-4 py-2.5 font-semibold"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md p-5 bg-white shadow-xl rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
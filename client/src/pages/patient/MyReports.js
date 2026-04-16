// MyReports.js
import React, { useState, useEffect } from "react";

const API_GATEWAY_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

function getAuthHeaders() {
    const storedUserId = localStorage.getItem("x-user-id");
    const storedRole = localStorage.getItem("x-role");

    return {
        "x-user-id": storedUserId || "P0001",
        "x-role": storedRole || "PATIENT",
        "x-verification-status": "VERIFIED",
    };
}

export default function MyReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("");
    const [reportType, setReportType] = useState("all");
    const [editingReport, setEditingReport] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const patientId = localStorage.getItem('x-user-id') || 'P0001';

            const response = await fetch(`${API_GATEWAY_BASE_URL}/api/medical-reports/${patientId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch reports');

            const data = await response.json();
            setReports(data.data || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDelete = async (reportId) => {
        try {
            const response = await fetch(`${API_GATEWAY_BASE_URL}/api/medical-reports/delete/${reportId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                setReports(reports.filter(report => report._id !== reportId));
                setShowDeleteConfirm(false);
                setDeletingId(null);
                setSuccessMessage('Report deleted successfully!');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                throw new Error('Delete failed');
            }
        } catch (err) {
            console.error('Error deleting report:', err);
            alert('Failed to delete report');
        }
    };

    const handleUpdate = async (reportId, updatedData) => {
        try {
            const formData = new FormData();
            formData.append('title', updatedData.title);
            formData.append('description', updatedData.description);
            formData.append('reportType', updatedData.reportType);
            formData.append('diagnosis', updatedData.diagnosis);
            formData.append('doctorId', updatedData.doctorId);

            if (updatedData.newFile) {
                formData.append('files', updatedData.newFile);
            }

            const response = await fetch(`${API_GATEWAY_BASE_URL}/api/medical-reports/update/${reportId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                setReports(reports.map(report =>
                    report._id === reportId ? result.data : report
                ));
                setShowEditModal(false);
                setEditingReport(null);
                setSuccessMessage('Report updated successfully!');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                throw new Error('Update failed');
            }
        } catch (err) {
            console.error('Error updating report:', err);
            alert('Failed to update report');
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesFilter = report.title.toLowerCase().includes(filter.toLowerCase()) ||
            report.description?.toLowerCase().includes(filter.toLowerCase());
        const matchesType = reportType === "all" || report.reportType === reportType;
        return matchesFilter && matchesType;
    });

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
                <p className="mt-3 text-slate-600">Loading your reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Success Message */}
            {successMessage && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
                    ✅ {successMessage}
                </div>
            )}

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="🔍 Search reports by title or description..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pl-10 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                    />
                    <span className="absolute left-3 top-3 text-slate-400">🔍</span>
                </div>
                <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                >
                    <option value="all">All Types</option>
                    <option value="Lab Test">🔬 Lab Tests</option>
                    <option value="Scan">🩻 Scans</option>
                    <option value="Other">📄 Other</option>
                </select>
                <button
                    onClick={fetchReports}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="text-slate-500">No reports found</p>
                    <p className="text-sm text-slate-400 mt-1">Use "Upload Reports" tab to add your first report</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredReports.map((report) => (
                        <div key={report._id} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <h3 className="font-semibold text-lg">{report.title}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${report.reportType === 'Lab Test' ? 'bg-blue-100 text-blue-700' :
                                            report.reportType === 'Scan' ? 'bg-purple-100 text-purple-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {report.reportType === 'Lab Test' ? '🔬' : report.reportType === 'Scan' ? '🩻' : '📄'} {report.reportType}
                                        </span>
                                    </div>

                                    {report.description && (
                                        <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                                    )}

                                    {report.diagnosis && (
                                        <p className="text-sm bg-slate-50 p-2 rounded-lg mb-2">
                                            <span className="font-semibold">🏥 Diagnosis:</span> {report.diagnosis}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                        <span>👨‍⚕️ Doctor ID: {report.doctorId}</span>
                                        <span>📅 Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}</span>
                                        {report.file?.url && (
                                            <a
                                                href={report.file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-600 hover:text-sky-700 flex items-center gap-1"
                                            >
                                                📎 View File →
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingReport(report);
                                            setShowEditModal(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-sm hover:bg-sky-200 transition-colors flex items-center gap-1"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeletingId(report._id);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm hover:bg-red-200 transition-colors flex items-center gap-1"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            {filteredReports.length > 0 && (
                <div className="text-sm text-slate-500 text-center pt-4 border-t border-slate-200">
                    📊 Total: {filteredReports.length} reports |
                    🔬 Lab: {reports.filter(r => r.reportType === 'Lab Test').length} |
                    🩻 Scans: {reports.filter(r => r.reportType === 'Scan').length}
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingReport && (
                <EditReportModal
                    report={editingReport}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingReport(null);
                    }}
                    onUpdate={handleUpdate}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <DeleteConfirmationModal
                    onConfirm={() => handleDelete(deletingId)}
                    onCancel={() => {
                        setShowDeleteConfirm(false);
                        setDeletingId(null);
                    }}
                />
            )}
        </div>
    );
}

// Edit Report Modal Component
function EditReportModal({ report, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        title: report.title || "",
        description: report.description || "",
        reportType: report.reportType || "Lab Test",
        diagnosis: report.diagnosis || "",
        doctorId: report.doctorId || "",
        newFile: null
    });
    const [updating, setUpdating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, newFile: file });
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        await onUpdate(report._id, formData);
        setUpdating(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">✏️ Edit Report</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Report Type</label>
                            <select
                                value={formData.reportType}
                                onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                            >
                                <option value="Lab Test">🔬 Lab Test</option>
                                <option value="Scan">🩻 Scan</option>
                                <option value="Other">📄 Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Doctor ID</label>
                            <input
                                type="text"
                                value={formData.doctorId}
                                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Diagnosis</label>
                            <input
                                type="text"
                                value={formData.diagnosis}
                                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none"
                                placeholder="Doctor's diagnosis"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1">Current File</label>
                            {report.file?.url && !previewUrl && (
                                <div className="mb-2">
                                    <a href={report.file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600">
                                        📎 View Current File
                                    </a>
                                </div>
                            )}
                            {previewUrl && (
                                <div className="mb-2">
                                    <img src={previewUrl} alt="Preview" className="max-h-32 rounded-lg" />
                                </div>
                            )}
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".jpg,.jpeg,.png,.pdf"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                            />
                            {formData.newFile && (
                                <p className="text-xs text-green-600 mt-1">✅ New file selected: {formData.newFile.name}</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={updating}
                                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
                            >
                                {updating ? "Updating..." : "💾 Update Report"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Delete Confirmation Modal
function DeleteConfirmationModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6">
                <div className="text-center">
                    <div className="text-5xl mb-3">🗑️</div>
                    <h2 className="text-xl font-bold mb-2">Confirm Delete</h2>
                    <p className="text-slate-600 mb-6">
                        Are you sure you want to delete this report? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                        >
                            Yes, Delete
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
import React, { useState, useEffect } from "react";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_GATEWAY_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

  function getAuthHeaders() {
    return {
      "x-user-id": localStorage.getItem("x-user-id") || "P0001",
      "x-role": "PATIENT",
      "x-verification-status": "VERIFIED",
    };
  }

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const patientId = localStorage.getItem('x-user-id') || 'P0001';

      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prescriptions/${patientId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to fetch prescriptions');

      const data = await response.json();
      setPrescriptions(data.data || []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        <p className="mt-2 text-slate-600">Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Your Prescriptions</h2>

        {prescriptions.length === 0 ? (
          <p className="text-slate-600">No prescriptions found.</p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((prescription) => (
              <div key={prescription._id} className="p-4 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Doctor ID:</span> {prescription.doctorId}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Prescribed on: {new Date(prescription.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {prescription.file?.url && (
                    <a
                      href={prescription.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-sm hover:bg-sky-200"
                    >
                      View Prescription →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
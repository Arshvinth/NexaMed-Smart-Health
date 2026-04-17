import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../../utils/userAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorNames, setDoctorNames] = useState({});

  const API_GATEWAY_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

  // Get current logged-in user ID
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userDetails = JSON.parse(userStr);
        return userDetails?.userId || userDetails?.id;
      }
    } catch (e) {
      console.error("Error parsing user:", e);
    }
    return localStorage.getItem("x-user-id");
  };

  // Fetch prescriptions for the logged-in patient
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const patientId = getCurrentUserId();

      if (!patientId) {
        throw new Error('Patient ID not found. Please log in again.');
      }

      console.log("Fetching prescriptions for patient:", patientId);

      // Use the correct API endpoint that filters by patientUserId
      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prescriptions?patientUserId=${patientId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          setPrescriptions([]);
          return;
        }
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch prescriptions');
      }

      const data = await response.json();

      // The API returns prescriptions directly from prescriptionService.js
      const prescriptionsData = Array.isArray(data) ? data : (data.data || []);

      console.log("Fetched prescriptions:", prescriptionsData.length);

      // Fetch doctor names for each prescription
      await fetchDoctorNames(prescriptionsData);

      setPrescriptions(prescriptionsData);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctor names for prescriptions
  const fetchDoctorNames = async (prescriptionsData) => {
    const uniqueDoctorIds = [...new Set(prescriptionsData.map(p => p.doctorUserId).filter(Boolean))];

    if (uniqueDoctorIds.length === 0) return;

    const namesMap = {};

    await Promise.all(
      uniqueDoctorIds.map(async (doctorUserId) => {
        try {
          // First try to get doctor by userId
          const response = await fetch(`${API_GATEWAY_BASE_URL}/api/doctors?userId=${doctorUserId}`, {
            headers: getAuthHeaders()
          });

          if (response.ok) {
            const doctors = await response.json();
            const doctor = Array.isArray(doctors) ? doctors.find(d => d.userId === doctorUserId) : doctors;
            namesMap[doctorUserId] = doctor?.fullName || doctorUserId;
          } else {
            // If that fails, try to get by doctorId (MongoDB _id)
            const doctorResponse = await fetch(`${API_GATEWAY_BASE_URL}/api/doctors/${doctorUserId}`, {
              headers: getAuthHeaders()
            });
            if (doctorResponse.ok) {
              const doctor = await doctorResponse.json();
              namesMap[doctorUserId] = doctor?.fullName || doctorUserId;
            } else {
              namesMap[doctorUserId] = doctorUserId;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch doctor name for ${doctorUserId}:`, err);
          namesMap[doctorUserId] = doctorUserId;
        }
      })
    );

    setDoctorNames(namesMap);
  };

  // Generate PDF for a single prescription
  const downloadPrescriptionAsPDF = (prescription) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 100);
    doc.text("Medical Prescription", pageWidth / 2, 20, { align: "center" });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 25, pageWidth - 20, 25);

    let yPos = 35;

    // Prescription ID and Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`ID: ${prescription._id}`, 20, yPos);
    yPos += 6;

    const createdDate = prescription.createdAt
      ? new Date(prescription.createdAt).toLocaleString()
      : new Date().toLocaleString();
    doc.text(`Date: ${createdDate}`, 20, yPos);
    yPos += 10;

    // Doctor Information
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 100);
    doc.text("Doctor Information", 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const doctorName = doctorNames[prescription.doctorUserId] || prescription.doctorUserId || "Unknown";
    doc.text(`Name: ${doctorName}`, 20, yPos);
    yPos += 6;
    doc.text(`ID: ${prescription.doctorUserId || "N/A"}`, 20, yPos);
    yPos += 10;

    // Patient Information
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 100);
    doc.text("Patient Information", 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`ID: ${prescription.patientUserId || "N/A"}`, 20, yPos);
    yPos += 6;

    if (prescription.appointmentId) {
      doc.text(`Appointment ID: ${prescription.appointmentId}`, 20, yPos);
      yPos += 6;
    }

    yPos += 5;

    // Medications Table
    if (prescription.items && prescription.items.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 100);
      doc.text("Prescribed Medications", 20, yPos);
      yPos += 7;

      const tableData = prescription.items.map((item, index) => [
        index + 1,
        item.medicineName || "N/A",
        item.dosage || "N/A",
        item.frequency || "N/A",
        item.durationDays ? `${item.durationDays} days` : "N/A"
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Medicine", "Dosage", "Frequency", "Duration"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30 }
        },
        margin: { left: 20 }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("No medications listed", 20, yPos);
      yPos += 10;
    }

    // Notes
    if (prescription.notes) {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 100);
      doc.text("Additional Notes", 20, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const splitNotes = doc.splitTextToSize(prescription.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated prescription. Valid without signature.",
      pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    // Save PDF
    const fileName = `prescription_${prescription._id.slice(-8)}.pdf`;
    doc.save(fileName);
  };

  // Download all prescriptions
  const downloadAllPrescriptionsAsPDF = () => {
    if (prescriptions.length === 0) {
      setError("No prescriptions to download");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 100);
    doc.text("All Prescriptions", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: "center" });
    doc.line(20, 35, pageWidth - 20, 35);

    let yPos = 45;

    for (let idx = 0; idx < prescriptions.length; idx++) {
      const prescription = prescriptions[idx];

      // Check if we need a new page
      if (yPos > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        yPos = 20;
      }

      // Prescription header
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 100);
      doc.text(`Prescription #${idx + 1}`, 20, yPos);
      yPos += 7;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const createdDate = prescription.createdAt
        ? new Date(prescription.createdAt).toLocaleDateString()
        : new Date().toLocaleDateString();
      doc.text(`Date: ${createdDate}`, 20, yPos);
      yPos += 6;

      // Doctor
      const doctorName = doctorNames[prescription.doctorUserId] || prescription.doctorUserId || "Unknown";
      doc.setTextColor(0, 0, 0);
      doc.text(`Doctor: ${doctorName}`, 20, yPos);
      yPos += 6;

      // Medications
      if (prescription.items && prescription.items.length > 0) {
        yPos += 3;
        const tableData = prescription.items.map((item) => [
          item.medicineName || "N/A",
          item.dosage || "N/A",
          item.frequency || "N/A",
          item.durationDays ? `${item.durationDays}d` : "N/A"
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Medicine", "Dosage", "Frequency", "Duration"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 20 },
          tableWidth: pageWidth - 40
        });

        yPos = doc.lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("No medications", 20, yPos);
        yPos += 10;
      }

      // Separator
      if (idx < prescriptions.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;
      }
    }

    doc.save(`all_prescriptions_${new Date().toISOString().split('T')[0]}.pdf`);
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
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">My Prescriptions</h1>
        {prescriptions.length > 0 && (
          <button
            onClick={downloadAllPrescriptionsAsPDF}
            className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            📥 Download All ({prescriptions.length})
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Prescriptions List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📋 Your Prescriptions ({prescriptions.length})
        </h2>

        {prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-600">No prescriptions found.</p>
            <p className="text-sm text-slate-400 mt-2">
              When doctors prescribe medications, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription, index) => (
              <div
                key={prescription._id}
                className="p-5 border border-slate-200 rounded-xl hover:shadow-md transition-all bg-white"
              >
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        #{index + 1}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Prescription
                      </span>
                      {prescription.createdAt && (
                        <span className="text-xs text-slate-500">
                          📅 {new Date(prescription.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Doctor Info */}
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">👨‍⚕️ Prescribed by:</span>{' '}
                        {doctorNames[prescription.doctorUserId] || prescription.doctorUserId || 'Unknown'}
                      </p>
                      {prescription.appointmentId && (
                        <p className="text-xs text-slate-500 mt-1">
                          Appointment ID: {prescription.appointmentId}
                        </p>
                      )}
                    </div>

                    {/* Medications */}
                    {prescription.items && prescription.items.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          💊 Medications:
                        </p>
                        <div className="space-y-2">
                          {prescription.items.map((item, idx) => (
                            <div key={idx} className="text-sm p-3 bg-blue-50 rounded-lg border-l-4 border-sky-400">
                              <div className="font-medium text-slate-800">{item.medicineName}</div>
                              <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-3">
                                <span>💊 Dosage: {item.dosage}</span>
                                <span>⏰ Frequency: {item.frequency}</span>
                                <span>📆 Duration: {item.durationDays} days</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {prescription.notes && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                        <p className="text-xs font-semibold text-amber-700">📝 Notes:</p>
                        <p className="text-sm text-slate-600">{prescription.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => downloadPrescriptionAsPDF(prescription)}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    📄 Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
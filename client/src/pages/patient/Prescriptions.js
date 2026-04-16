import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState([]);
  const [doctorId, setDoctorId] = useState("");

  const API_GATEWAY_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

  function getAuthHeaders() {
    return {
      "x-user-id": localStorage.getItem("x-user-id") || "TEST001",
      "x-role": "PATIENT",
      "x-verification-status": "VERIFIED",
    };
  }

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const patientId = localStorage.getItem('x-user-id') || 'TEST001';

      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prescription/${patientId}`, {
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

  // File dropzone configuration
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(reject =>
        `${reject.file.name}: ${reject.errors[0].message}`
      );
      setError(errors.join(", "));
      return;
    }

    const validFiles = acceptedFiles.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024;
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type);
      return isValidSize && isValidType;
    });

    if (validFiles.length === 0) {
      setError("No valid files selected. Please select PDF, JPG, or PNG files under 10MB.");
      return;
    }

    if (files.length + validFiles.length > 10) {
      setError("You can only upload up to 10 files at once");
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 10
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    if (!doctorId) {
      setError("Please enter doctor ID");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('doctorId', doctorId);

      const patientId = localStorage.getItem('x-user-id') || 'TEST001';
      formData.append('userid', patientId);

      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prescription/upload`, {
        method: 'POST',
        headers: {
          'x-user-id': patientId,
          'x-role': 'PATIENT',
          'x-verification-status': 'VERIFIED'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      const result = await response.json();

      setUploadProgress(100);
      setSuccess(`Successfully uploaded ${result.data?.length || files.length} prescription(s)`);

      // Reset form
      setTimeout(() => {
        setFiles([]);
        setDoctorId("");
        setShowUploadModal(false);
        setSuccess(null);
        fetchPrescriptions(); // Refresh the list
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload prescriptions');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

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
      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-extrabold">Prescriptions</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 flex items-center gap-2"
        >
          Upload Prescription
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Prescriptions List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📋 Your Prescriptions ({prescriptions.length})
        </h2>

        {prescriptions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-slate-600">No prescriptions found.</p>
            <p className="text-sm text-slate-400 mt-1">Upload your first prescription using the button above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((prescription, index) => (
              <div key={prescription._id} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-600">#{index + 1}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Prescription
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">👨‍⚕️ Doctor ID:</span> {prescription.doctorId}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      📅 Prescribed on: {new Date(prescription.uploadedAt).toLocaleDateString()}
                    </p>
                    {prescription.createdAt && (
                      <p className="text-xs text-slate-400 mt-1">
                        Uploaded: {new Date(prescription.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {prescription.file?.url && (
                    <a
                      href={prescription.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-sky-100 text-sky-700 text-sm hover:bg-sky-200 transition-colors flex items-center gap-1"
                    >
                      📎 View Prescription →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">📄 Upload Prescription</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setFiles([]);
                    setDoctorId("");
                    setError(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Doctor ID Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Doctor ID *
                  </label>
                  <input
                    type="text"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                    placeholder="Enter doctor ID"
                    required
                    disabled={uploading}
                  />
                </div>

                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Prescription Files *
                  </label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-300'}
                      ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input {...getInputProps()} disabled={uploading} />
                    <div className="text-4xl mb-2">📁</div>
                    <div className="font-semibold text-slate-700">
                      {isDragActive ? "Drop files here" : "Drag & drop files here"}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      PDF, JPG, PNG (max 10MB each, up to 10 files)
                    </div>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-50"
                      disabled={uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        document.querySelector('input[type="file"]')?.click();
                      }}
                    >
                      Choose files
                    </button>
                  </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      Selected Files ({files.length}/10)
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="text-sm">
                              <span className="font-medium">{file.name}</span>
                              <span className="text-xs text-slate-500 ml-2">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            disabled={uploading}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                      Please don't close the modal while uploading
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading || files.length === 0 || !doctorId}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : `Upload ${files.length} Prescription(s)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setFiles([]);
                      setDoctorId("");
                      setError(null);
                    }}
                    disabled={uploading}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Instructions */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                <h4 className="text-xs font-semibold text-slate-700 mb-1">📌 Instructions:</h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Supported formats: PDF, JPG, JPEG, PNG</li>
                  <li>Maximum file size: 10MB per file</li>
                  <li>Maximum files per upload: 10 files</li>
                  <li>Make sure to provide the correct doctor ID</li>
                  <li>Prescriptions are securely stored in the cloud</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
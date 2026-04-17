import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { getAuthHeaders } from "../../utils/userAuth";

export default function UploadReports() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");

  // Form data for medical report
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reportType: "Lab Test",
    diagnosis: "",
    doctorId: ""
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const patientId = storedUser?.id || localStorage.getItem('x-user-id') || 'TEST001';

      const response = await fetch('http://localhost:5000/api/doctors', {
        headers: {
          'x-user-id': patientId,
          'x-role': 'PATIENT'
        }
      });

      if (response.ok) {
        const doctorsList = await response.json();
        setDoctors(doctorsList);
      } else {
        console.error('Failed to fetch doctors:', response.status);
        setError('Failed to load doctors list');
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors list');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Use shared getAuthHeaders from utils; we'll remove Content-Type for FormData

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDoctorSelect = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    setFormData({
      ...formData,
      doctorId: doctorId
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    if (!formData.title) {
      setError("Please enter a title for the medical report");
      return;
    }

    if (!formData.doctorId) {
      setError("Please enter doctor ID");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const formDataToSend = new FormData();

      // Append files
      files.forEach(file => {
        formDataToSend.append('files', file);
      });

      // Append other form data
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('reportType', formData.reportType);
      formDataToSend.append('diagnosis', formData.diagnosis);
      formDataToSend.append('doctorId', formData.doctorId);

      // Use the correct patient ID (from stored user if available)
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const patientId = storedUser?.id || localStorage.getItem('x-user-id') || 'TEST001';
      formDataToSend.append('patientId', patientId);

      console.log('Uploading with patientId:', patientId);
      console.log('Files:', files.length);
      console.log('Form data:', {
        title: formData.title,
        reportType: formData.reportType,
        doctorId: formData.doctorId,
        patientId: patientId
      });

      // Use API Gateway
      const apiGatewayUrl = `http://localhost:5000/api/medical-reports/upload`;

      // Build headers from shared helper but remove Content-Type for FormData
      const headers = getAuthHeaders();
      if (headers["Content-Type"]) delete headers["Content-Type"];
      // ensure correct patient id and role for this request
      headers["x-user-id"] = patientId;
      headers["x-role"] = "PATIENT";
      headers["x-verification-status"] = "VERIFIED";

      console.log('Upload request headers:', headers);

      const response = await fetch(apiGatewayUrl, {
        method: 'POST',
        headers,
        body: formDataToSend
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);

        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your patient ID.');
        }
        if (response.status === 400) {
          throw new Error(`Bad request: ${errorText}`);
        }
        if (response.status === 500) {
          throw new Error(`Server error: ${errorText || 'Internal server error'}`);
        }
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();

      setUploadProgress(100);
      setUploadedReports(result.data || []);
      setSuccess(`Successfully uploaded ${result.data?.length || files.length} report(s)`);

      // Reset form after successful upload
      setTimeout(() => {
        setFiles([]);
        setFormData({
          title: "",
          description: "",
          reportType: "Lab Test",
          diagnosis: "",
          doctorId: ""
        });
        setUploadedReports([]);
        // Trigger refresh in MyReports component
        window.dispatchEvent(new Event('reportsUpdated'));
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload reports. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Upload Medical Reports</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Report Details Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Report Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                placeholder="e.g., Blood Test Report, X-Ray Results"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                placeholder="Additional notes about the report..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Report Type
                </label>
                <select
                  name="reportType"
                  value={formData.reportType}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                >
                  <option value="Lab Test">Lab Test</option>
                  <option value="Scan">Scan (X-Ray, MRI, CT)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select Doctor *
                </label>
                <select
                  value={selectedDoctor}
                  onChange={handleDoctorSelect}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                  required
                  disabled={loadingDoctors}
                >
                  <option value="">{loadingDoctors ? "Loading doctors..." : "Select a doctor"}</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor.userId}>
                      Dr. {doctor.fullName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
                {doctors.length === 0 && !loadingDoctors && (
                  <p className="text-xs text-amber-600 mt-1">
                    No verified doctors available. Please check back later.
                  </p>
                )}

              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Diagnosis (if provided by doctor)
              </label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                placeholder="Doctor's diagnosis from the report"
              />
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Files</h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-300'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} disabled={uploading} />
            <div className="font-semibold text-slate-700">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              PDF, JPG, PNG (max 10MB each, up to 10 files)
            </div>
            <button
              type="button"
              className="mt-4 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-50"
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation();
                document.querySelector('input[type="file"]')?.click();
              }}
            >
              Choose files
            </button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Selected Files ({files.length}/10)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
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
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
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
                Please don't close the page while uploading
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="text-green-700 text-sm">
              <strong>Success!</strong> {success}
            </div>
            {uploadedReports.length > 0 && (
              <div className="mt-2 text-xs text-green-600">
                Uploaded report IDs: {uploadedReports.map(r => r._id).join(", ")}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading || files.length === 0 || !formData.title || !formData.doctorId}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : `Upload ${files.length} Report(s)`}
          </button>

          <button
            type="button"
            onClick={() => {
              setFiles([]);
              setFormData({
                title: "",
                description: "",
                reportType: "Lab Test",
                diagnosis: "",
                doctorId: ""
              });
              setError(null);
              setSuccess(null);
            }}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Instructions:</h3>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>Supported formats: PDF, JPG, JPEG, PNG</li>
          <li>Maximum file size: 10MB per file</li>
          <li>Maximum files per upload: 10 files</li>
          <li>Make sure to provide accurate doctor ID</li>
          <li>Reports are securely stored and can be accessed by authorized doctors</li>
        </ul>
      </div>
    </div>
  );
}
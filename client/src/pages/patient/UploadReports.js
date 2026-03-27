import React from "react";
export default function UploadReports() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Upload Reports</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <div className="font-semibold">Drag & drop files here</div>
          <div className="text-sm text-slate-600 mt-1">
            PDF, JPG, PNG (UI only)
          </div>
          <button className="mt-4 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700">
            Choose files
          </button>
        </div>
      </div>
    </div>
  );
}
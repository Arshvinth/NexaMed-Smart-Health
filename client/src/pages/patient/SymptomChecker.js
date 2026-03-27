import React, { useState } from "react";

export default function SymptomChecker() {
  const [text, setText] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">AI Symptom Checker (Optional)</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-semibold text-slate-700">
          Describe your symptoms
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
          placeholder="e.g., fever, headache, sore throat..."
        />
        <button
          className="mt-4 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
          onClick={() => alert("UI-only. AI integration later.")}
        >
          Get suggestions
        </button>
      </div>
    </div>
  );
}
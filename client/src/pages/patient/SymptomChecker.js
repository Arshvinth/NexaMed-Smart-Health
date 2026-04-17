import React, { useState } from "react";
import { getAuthHeaders } from "../../utils/userAuth";

const API_GATEWAY_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

// developing purpose fallback
const DEV_AUTH = {
  userId: process.env.REACT_APP_PATIENT_USER_ID || "P0001",
  role: "PATIENT",
};

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [commonSymptoms, setCommonSymptoms] = useState([
    "fever", "headache", "cough", "fatigue", "nausea",
    "sore throat", "muscle pain", "runny nose", "chest pain",
    "shortness of breath", "dizziness", "vomiting", "diarrhea",
    "abdominal pain", "back pain", "joint pain", "rash"
  ]);

  const addSymptom = () => {
    if (currentSymptom.trim() && !symptoms.includes(currentSymptom.trim().toLowerCase())) {
      setSymptoms([...symptoms, currentSymptom.trim().toLowerCase()]);
      setCurrentSymptom("");
    }
  };

  const removeSymptom = (symptomToRemove) => {
    setSymptoms(symptoms.filter(s => s !== symptomToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addSymptom();
    }
  };

  const handleGetSuggestions = async () => {
    if (symptoms.length === 0) {
      setError("Please add at least one symptom");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build headers from shared helper and set user id
      const headers = getAuthHeaders();
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser?.id || localStorage.getItem('x-user-id') || DEV_AUTH.userId;
      headers['x-user-id'] = userId;
      headers['x-role'] = storedUser?.role || localStorage.getItem('x-role') || DEV_AUTH.role;

      // Send symptoms array to backend
      const response = await fetch(`${API_GATEWAY_BASE_URL}/api/prediction/predict`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          symptoms: symptoms,
          userId: userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message || "Unable to get suggestions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setSymptoms([]);
    setCurrentSymptom("");
    setResult(null);
    setError(null);
  };

  // Predefined symptom sets for testing
  const symptomPresets = {
    "Cold": ["fever", "cough", "runny nose"],
    "Migraine": ["headache", "nausea", "dizziness"],
    "Flu": ["fever", "fatigue", "muscle pain"],
    "Stomach Bug": ["nausea", "vomiting", "diarrhea"]
  };

  const loadPreset = (presetName) => {
    setSymptoms(symptomPresets[presetName]);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">AI Symptom Checker</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Enter Your Symptoms
        </label>

        {/* Quick test presets */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">Quick test:</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(symptomPresets).map(preset => (
              <button
                key={preset}
                onClick={() => loadPreset(preset)}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Symptom input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={currentSymptom}
            onChange={(e) => setCurrentSymptom(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
            placeholder="Type a symptom (e.g., fever, headache)"
          />
          <button
            onClick={addSymptom}
            className="px-4 py-2.5 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600"
          >
            Add Symptom
          </button>
        </div>

        {/* Common symptoms chips */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">Common symptoms (click to add):</p>
          <div className="flex flex-wrap gap-2">
            {commonSymptoms.slice(0, 12).map(symptom => (
              <button
                key={symptom}
                onClick={() => {
                  if (!symptoms.includes(symptom)) {
                    setSymptoms([...symptoms, symptom]);
                  }
                }}
                disabled={symptoms.includes(symptom)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${symptoms.includes(symptom)
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Selected symptoms list */}
        {symptoms.length > 0 && (
          <div className="mb-4 p-3 bg-slate-50 rounded-xl">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Your Symptoms ({symptoms.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 text-sky-700 text-sm"
                >
                  {symptom}
                  <button
                    onClick={() => removeSymptom(symptom)}
                    className="ml-1 hover:text-sky-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGetSuggestions}
            disabled={isLoading || symptoms.length === 0}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : "Check Disease"}
          </button>

          <button
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            onClick={clearAll}
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Single Disease Result */}
        {result && (
          <div className="mt-4 space-y-3 animate-in fade-in duration-300">
            <div className="p-4 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200">
              <h3 className="font-semibold text-sky-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Prediction Result
              </h3>

              <div className="space-y-3">
                {/* Disease Name */}
                <div className="bg-white rounded-lg p-3">
                  <p className="text-sm text-slate-600 mb-1">Predicted Disease:</p>
                  <p className="text-xl font-bold text-slate-900">
                    {result.disease || result.prediction || "Not detected"}
                  </p>
                </div>

                {/* Specialty */}
                {result.specialty && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-600 mb-1">Recommended Specialist:</p>
                    <p className="text-base font-semibold text-sky-700">
                      {result.specialty}
                    </p>
                  </div>
                )}

                {/* Confidence Score */}
                {result.confidence && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-600 mb-2">Confidence Level:</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-3">
                        <div
                          className={`rounded-full h-3 transition-all duration-500 ${parseFloat(result.confidence) > 0.7 ? 'bg-green-500' :
                            parseFloat(result.confidence) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${(parseFloat(result.confidence) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {(parseFloat(result.confidence) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {parseFloat(result.confidence) > 0.7 ? 'High confidence' :
                        parseFloat(result.confidence) > 0.4 ? 'Medium confidence' : 'Low confidence'}
                    </p>
                  </div>
                )}

                {/* Analyzed Symptoms */}
                {result.symptoms && result.symptoms.length > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-600 mb-2">Analyzed Symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.symptoms.map((symptom, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info from your model */}
                {result.message && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-700">{result.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <strong className="text-amber-700">⚠️ Medical Disclaimer</strong>
              <p className="mt-1">
                This is an AI-powered prediction based on your symptoms. Not a medical diagnosis.
                Please consult a healthcare professional for proper medical advice.
              </p>
            </div>

            {/* Next Steps */}
            <div className="text-sm bg-green-50 border border-green-200 p-3 rounded-lg">
              <strong className="text-green-700">💡 Recommended Next Steps:</strong>
              <ul className="mt-2 space-y-1 text-green-600 list-disc list-inside">
                <li>Consult a {result.specialty || "healthcare"} specialist</li>
                <li>Monitor your symptoms for any changes</li>
                <li>Seek immediate medical attention if symptoms worsen</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
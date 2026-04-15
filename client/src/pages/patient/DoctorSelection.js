import { useState, useEffect } from "react";
import api from "../../../api/client";

export default function DoctorSelection({ onSelectDoctor }) {
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all verified doctors (no specialty filter yet)
    api.get("/api/doctors").then((res) => {
      const unique = [...new Set(res.data.map((d) => d.specialization))];
      setSpecialties(unique);
    });
  }, []);

  useEffect(() => {
    if (!selectedSpecialty) return;
    setLoading(true);
    api
      .get(`/api/doctors?specialization=${selectedSpecialty}`)
      .then((res) => setDoctors(res.data))
      .finally(() => setLoading(false));
  }, [selectedSpecialty]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-medium mb-2">Speciality</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
        >
          <option value="">Select specialty</option>
          {specialties.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading && <p>Loading doctors...</p>}
      <div className="grid gap-4">
        {doctors.map((doc) => (
          <div
            key={doc._id}
            className="border p-4 rounded-2xl hover:shadow cursor-pointer"
            onClick={() => onSelectDoctor(doc)}
          >
            <h3 className="font-bold">{doc.fullName}</h3>
            <p className="text-sm text-slate-600">{doc.specialization}</p>
            <p className="text-sm">Fee: ${doc.fee}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import api from "../../api/client";

export default function DoctorAvailability({ doctor, onSelectDate }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!doctor) return;
    setLoading(true);
    api
      .get(`/api/doctors/${doctor.userId}/availability`)
      .then((res) => setAvailability(res.data))
      .finally(() => setLoading(false));
  }, [doctor]);

  // Group by date
  const grouped = availability.reduce((acc, slot) => {
    const date = new Date(slot.startTime).toISOString().split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onSelectDate(date);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">
        Available dates for Dr. {doctor.fullName}
      </h2>
      {loading && <p>Loading...</p>}
      <div className="flex flex-wrap gap-3">
        {Object.keys(grouped).map((date) => (
          <button
            key={date}
            onClick={() => handleDateSelect(date)}
            className={`px-4 py-2 rounded-full border ${selectedDate === date ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            {date}
          </button>
        ))}
      </div>
      {selectedDate && (
        <div>
          <p className="font-semibold">
            Available time blocks on {selectedDate}
          </p>
          {grouped[selectedDate].map((slot, i) => (
            <div key={i} className="text-sm text-slate-600">
              {new Date(slot.startTime).toLocaleTimeString()} -{" "}
              {new Date(slot.endTime).toLocaleTimeString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

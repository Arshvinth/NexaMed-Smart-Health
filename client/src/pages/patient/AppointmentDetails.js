import { useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function AppointmentDetails({
  doctor,
  selectedSlot,
  onConfirm,
}) {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        doctorUserId: doctor.userId,
        doctorName: doctor.fullName,
        doctorSpecialization: doctor.specialization,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        queueNumber: selectedSlot.queueNumber,
      };
      const res = await api.post("/api/appointments", payload);
      toast.success("Appointment created! Proceed to payment.");
      onConfirm(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="border p-5 rounded-2xl bg-white">
      <h3 className="text-xl font-bold mb-4">Appointment Summary</h3>
      <div className="space-y-2">
        <p>
          <span className="font-semibold">Doctor:</span> {doctor.fullName} (
          {doctor.specialization})
        </p>
        <p>
          <span className="font-semibold">Date:</span>{" "}
          {new Date(selectedSlot.startTime).toDateString()}
        </p>
        <p>
          <span className="font-semibold">Time:</span>{" "}
          {new Date(selectedSlot.startTime).toLocaleTimeString()} -{" "}
          {new Date(selectedSlot.endTime).toLocaleTimeString()}
        </p>
        <p>
          <span className="font-semibold">Queue number:</span>{" "}
          {selectedSlot.queueNumber}
        </p>
        <p>
          <span className="font-semibold">Fee:</span> ${doctor.fee}
        </p>
      </div>
      <button
        onClick={handleCreate}
        disabled={creating}
        className="mt-6 w-full bg-slate-900 text-white p-2 rounded-xl"
      >
        {creating ? "Creating..." : "Confirm & Pay"}
      </button>
    </div>
  );
}

// frontend/src/pages/patient/BookAppointment.js
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DoctorSelection from "./DoctorSelection";
import DoctorAvailability from "./DoctorAvailability";
import TimeSlots from "./TimeSlots";
import AppointmentDetails from "./AppointmentDetails";
import PaymentPage from "./Payments";
import api from "../../api/client";
import toast from "react-hot-toast";

export default function BookAppointment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [rescheduleData, setRescheduleData] = useState(null);

  // Handle reschedule mode from navigation state
  useEffect(() => {
    if (location.state?.rescheduleMode) {
      setRescheduleData({
        originalAppointment: location.state.originalAppointment,
        doctor: location.state.doctor,
      });
      setDoctor(location.state.doctor);
      setStep(2); // Skip doctor selection, go to availability
      toast("Select a new time slot to reschedule");
    }
  }, [location.state]);

  const handleSelectDoctor = (doc) => {
    setDoctor(doc);
    setStep(2);
  };

  const handleSelectDateTime = (block) => {
    setSelectedBlock(block);
    setStep(3);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleData || !selectedSlot) return;

    try {
      // Call reschedule endpoint
      const response = await api.post(
        `/api/appointments/${rescheduleData.originalAppointment._id}/reschedule`,
        {
          newStartTime: selectedSlot.startTime,
          newEndTime: selectedSlot.endTime,
          queueNumber: selectedSlot.queueNumber,
        },
      );

      toast.success("Appointment rescheduled successfully!");
      navigate("/patient/appointments");
    } catch (err) {
      console.error("Reschedule error:", err.response?.data);
      toast.error(err.response?.data?.message || "Reschedule failed");
    }
  };

  const handleAppointmentCreated = async (appt) => {
    if (rescheduleData) {
      // This is reschedule mode - call handleRescheduleConfirm directly
      await handleRescheduleConfirm();
    } else {
      // New appointment - go to payment
      setAppointment(appt);
      setStep(5);
    }
  };

  const handlePaymentSuccess = () => {
    navigate("/patient/appointments");
  };

  // Step labels
  const steps = [
    "Doctor",
    "Date & Time",
    "Slots",
    "Confirm",
    rescheduleData ? "Reschedule" : "Pay",
  ];
  const currentStepIndex = step - 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((label, idx) => (
            <div key={idx} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${
                    idx <= currentStepIndex
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-400"
                  }
                `}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-xs mt-1 ${idx <= currentStepIndex ? "text-slate-700" : "text-slate-400"}`}
                >
                  {label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${idx < currentStepIndex ? "bg-slate-900" : "bg-slate-200"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {step === 1 && <DoctorSelection onSelectDoctor={handleSelectDoctor} />}
      {step === 2 && doctor && (
        <DoctorAvailability
          doctor={doctor}
          onSelectDateTime={handleSelectDateTime}
        />
      )}
      {step === 3 && doctor && selectedBlock && (
        <TimeSlots
          doctor={doctor}
          selectedBlock={selectedBlock}
          onSelectSlot={handleSelectSlot}
          isReschedule={!!rescheduleData}
        />
      )}
      {step === 4 && doctor && selectedSlot && (
        <AppointmentDetails
          doctor={doctor}
          selectedSlot={selectedSlot}
          onConfirm={handleAppointmentCreated}
          isReschedule={!!rescheduleData}
        />
      )}
      {step === 5 && !rescheduleData && appointment && (
        <PaymentPage
          appointment={appointment}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

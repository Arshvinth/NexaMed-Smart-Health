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

// Global variable to track if toast has been shown (prevents duplicate in Strict Mode)
let rescheduleToastShown = false;

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
    // Only run when we have rescheduleMode
    if (location.state?.rescheduleMode) {
      setRescheduleData({
        originalAppointment: location.state.originalAppointment,
        doctor: location.state.doctor,
      });
      setDoctor(location.state.doctor);
      setStep(2); // Skip doctor selection, go to availability

      // Show toast only once using global variable
      if (!rescheduleToastShown) {
        rescheduleToastShown = true;

        toast(
          "📅 Select Date and Time Slot for the new rescheduling appointment",
          {
            duration: 4000,
            icon: "🔄",
            style: {
              background: "#eff6ff",
              color: "#1e40af",
              border: "1px solid #bfdbfe",
              padding: "12px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "500",
            },
          },
        );
      }
    }
  }, [location.state?.rescheduleMode]);

  // Reset the global variable when component unmounts
  useEffect(() => {
    return () => {
      // Reset after a delay to allow for next reschedule
      setTimeout(() => {
        rescheduleToastShown = false;
      }, 500);
    };
  }, []);

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

      toast.success("Appointment rescheduled successfully!", {
        duration: 4000,
        style: {
          background: "#f0fdf4",
          color: "#16a34a",
          border: "1px solid #bbf7d0",
          padding: "12px",
          borderRadius: "12px",
        },
      });
      navigate("/patient/appointments");
    } catch (err) {
      console.error("Reschedule error:", err.response?.data);
      toast.error(err.response?.data?.message || "Reschedule failed", {
        duration: 4000,
        style: {
          background: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          padding: "12px",
          borderRadius: "12px",
        },
      });
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
      {/* Step indicator with green theme */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((label, idx) => (
            <div key={idx} className="flex-1 relative">
              <div className="flex flex-col items-center">
                {/* Step Circle - Smaller size */}
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${
                    idx < currentStepIndex
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
                      : idx === currentStepIndex
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg ring-4 ring-emerald-100"
                        : "bg-neutral-100 text-neutral-400 border-2 border-neutral-200"
                  }
                `}
                >
                  {idx < currentStepIndex ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-xs mt-1.5 font-medium ${
                    idx <= currentStepIndex
                      ? "text-emerald-700"
                      : "text-neutral-400"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 transition-all duration-300 ${
                    idx < currentStepIndex
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : "bg-neutral-200"
                  }`}
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

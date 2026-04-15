import { useState } from "react";
import DoctorSelection from "./DoctorSelection";
import DoctorAvailability from "./DoctorAvailability";
import TimeSlots from "./TimeSlots";
import AppointmentDetails from "./AppointmentDetails";
import PaymentPage from "./Payments";

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointment, setAppointment] = useState(null);

  const handleSelectDoctor = (doc) => {
    setDoctor(doc);
    setStep(2);
  };
  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setStep(3);
  };
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };
  const handleAppointmentCreated = (appt) => {
    setAppointment(appt);
    setStep(5);
  };
  const handlePaymentSuccess = () => {
    // PaymentPage redirects to /patient/appointments automatically
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <span className={step >= 1 ? "text-slate-900 font-bold" : ""}>
          1. Doctor
        </span>{" "}
        →
        <span className={step >= 2 ? "text-slate-900 font-bold" : ""}>
          2. Date
        </span>{" "}
        →
        <span className={step >= 3 ? "text-slate-900 font-bold" : ""}>
          3. Time
        </span>{" "}
        →
        <span className={step >= 4 ? "text-slate-900 font-bold" : ""}>
          4. Confirm
        </span>{" "}
        →
        <span className={step >= 5 ? "text-slate-900 font-bold" : ""}>
          5. Pay
        </span>
      </div>

      {step === 1 && <DoctorSelection onSelectDoctor={handleSelectDoctor} />}
      {step === 2 && (
        <DoctorAvailability doctor={doctor} onSelectDate={handleSelectDate} />
      )}
      {step === 3 && (
        <TimeSlots
          doctor={doctor}
          date={selectedDate}
          onSelectSlot={handleSelectSlot}
        />
      )}
      {step === 4 && (
        <AppointmentDetails
          doctor={doctor}
          selectedSlot={selectedSlot}
          onConfirm={handleAppointmentCreated}
        />
      )}
      {step === 5 && (
        <PaymentPage
          appointment={appointment}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

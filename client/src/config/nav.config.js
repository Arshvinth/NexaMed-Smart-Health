export const patientNav = [
  { label: "Dashboard", to: "/patient", end: true },
  { label: "Profile", to: "/patient/profile" },
  { label: "Book Appointment", to: "/patient/book" },
  { label: "My Appointments", to: "/patient/appointments" },
  { label: "Upload Reports", to: "/patient/reports/upload" },
  { label: "Prescriptions", to: "/patient/prescriptions" },
  { label: "Video Consultation", to: "/patient/video" },
  { label: "Payments", to: "/patient/payments" },
  { label: "Symptom Checker (AI)", to: "/patient/symptom-checker" },
];

export const doctorNav = [
  { label: "Dashboard", to: "/doctor", end: true },
  { label: "Profile", to: "/doctor/profile" },
  { label: "Availability", to: "/doctor/availability" },
  { label: "Appointment Requests", to: "/doctor/requests" },
  { label: "Consultation Room", to: "/doctor/consult" },
  { label: "My Prescriptions", to: "/doctor/my-prescriptions" },
  { label: "Issue Prescription", to: "/doctor/prescriptions" },
  { label: "Patient Reports", to: "/doctor/patient-reports" },
];

export const adminNav = [
  { label: "Dashboard", to: "/admin", end: true },
  { label: "Manage Users", to: "/admin/users" },
  { label: "Verify Doctors", to: "/admin/verify-doctors" },
  { label: "Transactions", to: "/admin/transactions" },
  { label: "Platform Operations", to: "/admin/operations" },
];
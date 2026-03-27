import React from "react";
import { createBrowserRouter } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// General pages
import Home from "./pages/general/Home";
import Login from "./pages/general/Login";
import Signup from "./pages/general/Signup";
import Unauthorized from "./pages/general/Unauthorized";
import NotFound from "./pages/general/NotFound";

// Patient pages
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";
import UploadReports from "./pages/patient/UploadReports";
import Prescriptions from "./pages/patient/Prescriptions";
import VideoConsultation from "./pages/patient/VideoConsultation";
import Payments from "./pages/patient/Payments";
import SymptomChecker from "./pages/patient/SymptomChecker";

// Doctor pages
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorProfile from "./pages/doctor/Profile";
import Availability from "./pages/doctor/Availability";
import AppointmentRequests from "./pages/doctor/AppointmentRequests";
import ConsultationRoom from "./pages/doctor/ConsultationRoom";
import IssuePrescription from "./pages/doctor/IssuePrescription";
import PatientReports from "./pages/doctor/PatientReports";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import VerifyDoctors from "./pages/admin/VerifyDoctors";
import Transactions from "./pages/admin/Transactions";
import PlatformOperations from "./pages/admin/PlatformOperations";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/unauthorized", element: <Unauthorized /> },

      // Dashboards (UI only for now)
      {
        element: <DashboardLayout />,
        children: [
          // Patient
          { path: "/patient", element: <PatientDashboard /> },
          { path: "/patient/profile", element: <PatientProfile /> },
          { path: "/patient/book", element: <BookAppointment /> },
          { path: "/patient/appointments", element: <MyAppointments /> },
          { path: "/patient/reports/upload", element: <UploadReports /> },
          { path: "/patient/prescriptions", element: <Prescriptions /> },
          { path: "/patient/video/:sessionId?", element: <VideoConsultation /> },
          { path: "/patient/payments", element: <Payments /> },
          { path: "/patient/symptom-checker", element: <SymptomChecker /> },

          // Doctor
          { path: "/doctor", element: <DoctorDashboard /> },
          { path: "/doctor/profile", element: <DoctorProfile /> },
          { path: "/doctor/availability", element: <Availability /> },
          { path: "/doctor/requests", element: <AppointmentRequests /> },
          { path: "/doctor/consult/:sessionId?", element: <ConsultationRoom /> },
          { path: "/doctor/prescriptions/:appointmentId?", element: <IssuePrescription /> },
          { path: "/doctor/patient-reports/:patientId?", element: <PatientReports /> },

          // Admin
          { path: "/admin", element: <AdminDashboard /> },
          { path: "/admin/users", element: <Users /> },
          { path: "/admin/verify-doctors", element: <VerifyDoctors /> },
          { path: "/admin/transactions", element: <Transactions /> },
          { path: "/admin/operations", element: <PlatformOperations /> },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
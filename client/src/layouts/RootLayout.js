import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function RootLayout() {
  const { pathname } = useLocation();
  const isDashboard =
    pathname.startsWith("/patient") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {!isDashboard && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}
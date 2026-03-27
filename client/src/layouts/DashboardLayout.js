import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Topbar />
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
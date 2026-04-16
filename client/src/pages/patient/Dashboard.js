// Dashboard.js
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Stethoscope,
  Upload,
  FileText,
  Pill,
  Calendar,
  CalendarPlus,
  Video,
  User,
  CreditCard,
  Activity,
  Heart,
  Clock,
  Brain,
  Sparkles,
  TrendingUp,
  Shield,
  Bell,
  ChevronRight
} from "lucide-react";

import SymptomChecker from "./SymptomChecker";
import UploadReports from "./UploadReports";
import MyReports from "./MyReports";
import Prescriptions from "./Prescriptions";
import Profile from "./Profile";
import VideoConsultation from "./VideoConsultation";
import BookAppointment from "./BookAppointment";
import MyAppointments from "./MyAppointments";
import Payments from "./Payments";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeDashboardTab') || 'overview';
  });

  const [refreshReports, setRefreshReports] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    prescriptions: 0,
    appointments: 0,
    aiChecks: 0
  });

  useEffect(() => {
    localStorage.setItem('activeDashboardTab', activeTab);
  }, [activeTab]);

  // Fetch stats from your backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const patientId = localStorage.getItem('x-user-id') || 'TEST001';
        const API_BASE = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:5000";

        // Fetch reports count
        const reportsRes = await fetch(`${API_BASE}/api/medical-reports/${patientId}`, {
          headers: {
            "x-user-id": patientId,
            "x-role": "PATIENT",
          }
        });
        const reportsData = await reportsRes.json();
        setStats(prev => ({ ...prev, totalReports: reportsData.data?.length || 0 }));

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [refreshReports]);

  const tabs = [
    { id: "overview", name: "Overview", icon: LayoutDashboard, description: "Dashboard home" },
    { id: "symptom-checker", name: "Symptom Checker", icon: Stethoscope, description: "AI symptom analysis" },
    { id: "upload-reports", name: "Upload Reports", icon: Upload, description: "Upload medical reports" },
    { id: "my-reports", name: "My Reports", icon: FileText, description: "View and manage reports" },
    { id: "prescriptions", name: "Prescriptions", icon: Pill, description: "View prescriptions" },
    { id: "appointments", name: "Appointments", icon: Calendar, description: "My appointments" },
    { id: "book-appointment", name: "Book Appointment", icon: CalendarPlus, description: "Schedule new appointment" },
    { id: "video-consult", name: "Video Consult", icon: Video, description: "Start video consultation" },
    { id: "profile", name: "Profile", icon: User, description: "Manage profile" },
    { id: "payments", name: "Payments", icon: CreditCard, description: "Payment history" },
  ];

  const handleReportUpload = () => {
    setRefreshReports(prev => !prev);
    setTimeout(() => {
      setActiveTab('my-reports');
    }, 2000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview onNavigate={setActiveTab} stats={stats} />;
      case "symptom-checker":
        return <SymptomChecker />;
      case "upload-reports":
        return <UploadReports onUploadComplete={handleReportUpload} />;
      case "my-reports":
        return <MyReports key={refreshReports} />;
      case "prescriptions":
        return <Prescriptions />;
      case "appointments":
        return <MyAppointments />;
      case "book-appointment":
        return <BookAppointment />;
      case "video-consult":
        return <VideoConsultation />;
      case "profile":
        return <Profile />;
      case "payments":
        return <Payments />;
      default:
        return <Overview onNavigate={setActiveTab} stats={stats} />;
    }
  };

  const IconComponent = tabs.find(tab => tab.id === activeTab)?.icon || LayoutDashboard;

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <Sparkles className="h-7 w-7" />
              Welcome back!
            </h1>
            <p className="mt-1 text-sky-100">Manage your health information and appointments</p>
          </div>
          <div className="bg-white/20 rounded-full p-3">
            <IconComponent className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={FileText}
          value={stats.totalReports}
          label="Total Reports"
          color="blue"
          trend="+12%"
        />
        <StatCard
          icon={Pill}
          value={stats.prescriptions}
          label="Prescriptions"
          color="green"
          trend="+5%"
        />
        <StatCard
          icon={Calendar}
          value={stats.appointments}
          label="Appointments"
          color="purple"
          trend="+2"
        />
        <StatCard
          icon={Brain}
          value={stats.aiChecks}
          label="AI Checks"
          color="orange"
          trend="+8%"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl">
        <div className="flex gap-1 min-w-max px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                  ? "text-sky-600 border-b-2 border-sky-600 bg-sky-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, value, label, color, trend }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600"
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

// Overview Component with Quick Actions
function Overview({ onNavigate, stats }) {
  const quickActions = [
    { id: "symptom-checker", name: "AI Symptom Checker", icon: Stethoscope, color: "from-sky-500 to-sky-600", description: "Check your symptoms with AI" },
    { id: "upload-reports", name: "Upload Reports", icon: Upload, color: "from-blue-500 to-blue-600", description: "Upload medical reports" },
    { id: "book-appointment", name: "Book Appointment", icon: CalendarPlus, color: "from-green-500 to-green-600", description: "Schedule with a doctor" },
    { id: "video-consult", name: "Video Consult", icon: Video, color: "from-purple-500 to-purple-600", description: "Start video consultation" },
  ];

  const features = [
    { id: "my-reports", name: "My Reports", icon: FileText, color: "bg-indigo-100 text-indigo-700", description: "View all medical reports" },
    { id: "prescriptions", name: "Prescriptions", icon: Pill, color: "bg-pink-100 text-pink-700", description: "View prescriptions" },
    { id: "appointments", name: "Appointments", icon: Calendar, color: "bg-yellow-100 text-yellow-700", description: "Manage appointments" },
    { id: "profile", name: "Profile", icon: User, color: "bg-teal-100 text-teal-700", description: "Update profile" },
  ];

  const recentActivities = [
    { id: 1, action: "No recent activity", time: "", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-sky-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="group p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-left hover:shadow-md"
              >
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-r ${action.color} items-center justify-center text-white mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-900">{action.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Features */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            All Features
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => onNavigate(feature.id)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-center group"
                >
                  <div className={`inline-flex h-10 w-10 rounded-lg ${feature.color} items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-sm text-slate-900">{feature.name}</div>
                  <div className="text-xs text-slate-500">{feature.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">{activity.action}</p>
                    <p className="text-xs text-slate-400">{activity.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Health Tips */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50 p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-sky-600" />
          Health Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">• 🏥 Regular health checkups can help prevent diseases</li>
            <li className="flex items-center gap-2">• 📋 Keep your medical reports organized for easy access</li>
            <li className="flex items-center gap-2">• 🤖 Use AI symptom checker for initial guidance</li>
          </ul>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2">• 💊 Always take medications as prescribed by your doctor</li>
            <li className="flex items-center gap-2">• 🩺 Consult a doctor for proper medical advice</li>
            <li className="flex items-center gap-2">• 📅 Don't miss your scheduled appointments</li>
          </ul>
        </div>
      </div>

      {/* Notification Banner */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm text-amber-800">
              <strong>Reminder:</strong> Regular health checkups are important for maintaining good health.
            </p>
          </div>
          <button className="text-amber-600 hover:text-amber-800 text-sm font-semibold">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
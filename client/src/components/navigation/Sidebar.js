import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logoMark from "../../assets/NexaMed.svg";
import { patientNav, doctorNav, adminNav } from "../../config/nav.config";

export default function Sidebar() {
  const { pathname } = useLocation();

  const { title, items } = useMemo(() => {
    if (pathname.startsWith("/doctor")) return { title: "Doctor", items: doctorNav };
    if (pathname.startsWith("/admin")) return { title: "Admin", items: adminNav };
    return { title: "Patient", items: patientNav };
  }, [pathname]);

  return (
    <aside className="w-72 hidden md:block border-r border-slate-200 bg-gradient-to-b from-slate-50 via-white to-white min-h-screen sticky top-0">
      <div className="flex flex-col h-screen">
        <div className="px-5 pt-6 pb-4 border-b border-slate-200/70 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">
              ROLE
            </div>
            <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {title} Workspace
            </div>
          </div>
        </div>

        <nav className="px-3 pt-4 space-y-1 overflow-y-auto flex-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-sky-600/90 text-white shadow-sm translate-x-0.5"
                    : "text-slate-700 hover:bg-slate-50 hover:translate-x-0.5"
                }`
              }
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
                  pathname === item.to
                    ? "bg-sky-200"
                    : "bg-slate-300 group-hover:bg-sky-200"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-4 pt-3 border-t border-slate-200/70 bg-white/80">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden logo-glow">
              <img src={logoMark} alt="NexaMed logo" className="h-7 w-7" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">NexaMed</div>
              <div className="text-[11px] text-slate-500">SmartHealth Platform</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
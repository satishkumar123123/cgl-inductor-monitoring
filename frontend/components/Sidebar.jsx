import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FileBarChart2, Factory, ChevronDown, FileText, History, Gauge, CalendarRange, CalendarDays, LineChart, ShieldAlert } from "lucide-react";
import useAuth from "../hooks/useAuth.js";

const itemClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
    isActive ? "bg-cyan-50 text-cyan-700 font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  }`;

function SidebarSection({ icon: Icon, label, defaultOpen, items, onNavigate }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon size={15} className="text-cyan-600" /> {label}
        </span>
        <ChevronDown size={13} className={open ? "rotate-180 transition-transform text-slate-500" : "transition-transform text-slate-500"} />
      </button>
      {open && (
        <div className="flex flex-col gap-1 mt-1 pl-2 border-l border-slate-200 ml-3">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={itemClass} onClick={onNavigate}>
              <item.icon size={13} /> {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Left sidebar housing the Reports and Production modules. Self-contained
 * and additive — fitted for clean white/light theme dashboards.
 */
export default function Sidebar({ open = false, onClose }) {
  const { user } = useAuth();

  const content = (
    <>
      <NavLink to="/analytics" className={({ isActive }) => itemClass({ isActive }) + " mb-2 font-bold"} onClick={onClose}>
        <LineChart size={15} className="text-cyan-600" /> Analytics Dashboard
      </NavLink>
      <div className="border-t border-slate-200 my-2" />
      <SidebarSection
        icon={FileBarChart2}
        label="Reports"
        defaultOpen
        items={[
          { to: "/reports/pm-pot", label: "PM POT Analysis Report", icon: FileText },
          { to: "/reports/main-pot", label: "MAIN POT Analysis Report", icon: FileText },
          { to: "/reports/history", label: "Report History", icon: History },
        ]}
        onNavigate={onClose}
      />
      <SidebarSection
        icon={Factory}
        label="Production"
        defaultOpen
        items={[
          { to: "/power/consumption", label: "Daily Production & Power", icon: Gauge },
          { to: "/power/monthly", label: "Monthly Report", icon: CalendarDays },
          { to: "/power/yearly", label: "Yearly Report", icon: CalendarRange },
        ]}
        onNavigate={onClose}
      />
      {user?.role === "Admin" && (
        <>
          <div className="border-t border-slate-200 my-2" />
          <NavLink to="/audit-logs" className={({ isActive }) => itemClass({ isActive }) + " font-bold"} onClick={onClose}>
            <ShieldAlert size={15} className="text-orange-600" /> Audit Logs
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="no-print fixed inset-0 z-40 bg-slate-900/40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`no-print w-60 shrink-0 border-r border-slate-200 bg-white md:bg-slate-50/80 backdrop-blur-md min-h-[calc(100vh-64px)] px-3 py-4 fixed md:static inset-y-0 left-0 z-50 md:z-auto transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {content}
      </aside>
    </>
  );
}
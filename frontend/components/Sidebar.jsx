import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FileBarChart2, Factory, ChevronDown, FileText, History, Gauge, CalendarRange, CalendarDays, LineChart, ShieldAlert } from "lucide-react";
import useAuth from "../hooks/useAuth.js";

const itemClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
    isActive ? "bg-cyan-100/80 text-cyan-800 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  }`;

function SidebarSection({ icon: Icon, label, defaultOpen, items, onNavigate }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon size={15} className="text-cyan-600" /> {label}
        </span>
        <ChevronDown size={13} className={open ? "rotate-180 transition-transform text-slate-500" : "transition-transform text-slate-500"} />
      </button>
      {open && (
        <div className="flex flex-col gap-1 mt-1 pl-2 border-l-2 border-slate-200 ml-3.5">
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
 * Left sidebar housing the Reports and Production modules.
 * Designed for Pure White UI layout.
 */
export default function Sidebar({ open = false, onClose }) {
  const { user } = useAuth();

  const content = (
    <>
      <NavLink to="/analytics" className={({ isActive }) => itemClass({ isActive }) + " mb-2 font-bold"} onClick={onClose}>
        <LineChart size={15} className="text-cyan-600" /> Analytics Dashboard
      </NavLink>
      <div className="border-t border-slate-200 my-2.5" />
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
          <div className="border-t border-slate-200 my-2.5" />
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
        <div className="no-print fixed inset-0 z-40 bg-slate-900/30 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`no-print w-60 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)] px-3 py-4 fixed md:static inset-y-0 left-0 z-50 md:z-auto shadow-sm transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {content}
      </aside>
    </>
  );
}
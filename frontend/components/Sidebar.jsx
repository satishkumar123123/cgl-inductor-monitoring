import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FileBarChart2, Factory, ChevronDown, FileText, Gauge, CalendarRange, CalendarDays, LineChart, ShieldAlert } from "lucide-react";
import useAuth from "../hooks/useAuth.js";

// Helper function to colorize every character in a text
const colorizeText = (text, colors) => {
  return text.split("").map((char, idx) => (
    <span key={idx} className={colors[idx % colors.length]}>
      {char}
    </span>
  ));
};

// Vibrant color sets for each menu item
const COLOR_PALETTES = {
  analytics: ["text-cyan-600", "text-blue-600", "text-indigo-600", "text-purple-600", "text-pink-600", "text-rose-600", "text-amber-600", "text-emerald-600"],
  pmPot: ["text-purple-600", "text-pink-600", "text-rose-600", "text-red-600", "text-amber-600", "text-emerald-600", "text-cyan-600", "text-blue-600"],
  mainPot: ["text-cyan-600", "text-teal-600", "text-emerald-600", "text-amber-600", "text-rose-600", "text-indigo-600", "text-purple-600", "text-blue-600"],
  dailyProd: ["text-emerald-600", "text-teal-600", "text-cyan-600", "text-blue-600", "text-indigo-600", "text-purple-600", "text-rose-600"],
  monthly: ["text-blue-600", "text-indigo-600", "text-purple-600", "text-pink-600", "text-rose-600", "text-amber-600", "text-emerald-600"],
  yearly: ["text-rose-600", "text-purple-600", "text-indigo-600", "text-blue-600", "text-cyan-600", "text-emerald-600", "text-amber-600"],
  auditLogs: ["text-orange-600", "text-amber-600", "text-red-600", "text-rose-600", "text-purple-600", "text-indigo-600", "text-blue-600"]
};

const itemClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
    isActive ? "bg-slate-100 shadow-sm border border-slate-200 scale-[1.02]" : "hover:bg-slate-50"
  }`;

function SidebarSection({ icon: Icon, label, labelColor, defaultOpen, items, onNavigate }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon size={15} className={labelColor} />
          <span>{label}</span>
        </span>
        <ChevronDown size={13} className={open ? "rotate-180 transition-transform text-slate-500" : "transition-transform text-slate-500"} />
      </button>
      {open && (
        <div className="flex flex-col gap-1 mt-1 pl-2 border-l-2 border-slate-200 ml-3.5">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={itemClass} onClick={onNavigate}>
              <item.icon size={14} className={item.iconColor} />
              <span className="tracking-wide">
                {colorizeText(item.label, item.colors)}
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open = false, onClose }) {
  const { user } = useAuth();

  const content = (
    <>
      {/* Analytics Dashboard */}
      <NavLink to="/analytics" className={({ isActive }) => itemClass({ isActive }) + " mb-2 font-black"} onClick={onClose}>
        <LineChart size={15} className="text-cyan-600 shrink-0" />
        <span className="tracking-wide">
          {colorizeText("Analytics Dashboard", COLOR_PALETTES.analytics)}
        </span>
      </NavLink>

      <div className="border-t border-slate-200 my-2.5" />

      {/* Reports Section (Only PM POT and MAIN POT) */}
      <SidebarSection
        icon={FileBarChart2}
        label="Reports"
        labelColor="text-purple-600"
        defaultOpen
        items={[
          { to: "/reports/pm-pot", label: "PM POT Analysis Report", icon: FileText, iconColor: "text-purple-600", colors: COLOR_PALETTES.pmPot },
          { to: "/reports/main-pot", label: "MAIN POT Analysis Report", icon: FileText, iconColor: "text-cyan-600", colors: COLOR_PALETTES.mainPot },
        ]}
        onNavigate={onClose}
      />

      {/* Production Section */}
      <SidebarSection
        icon={Factory}
        label="Production"
        labelColor="text-emerald-600"
        defaultOpen
        items={[
          { to: "/power/consumption", label: "Daily Production & Power", icon: Gauge, iconColor: "text-emerald-600", colors: COLOR_PALETTES.dailyProd },
          { to: "/power/monthly", label: "Monthly Report", icon: CalendarDays, iconColor: "text-blue-600", colors: COLOR_PALETTES.monthly },
          { to: "/power/yearly", label: "Yearly Report", icon: CalendarRange, iconColor: "text-rose-600", colors: COLOR_PALETTES.yearly },
        ]}
        onNavigate={onClose}
      />

      {/* Admin Audit Logs */}
      {user?.role === "Admin" && (
        <>
          <div className="border-t border-slate-200 my-2.5" />
          <NavLink to="/audit-logs" className={({ isActive }) => itemClass({ isActive }) + " font-black"} onClick={onClose}>
            <ShieldAlert size={15} className="text-orange-600 shrink-0" />
            <span className="tracking-wide">
              {colorizeText("Audit Logs", COLOR_PALETTES.auditLogs)}
            </span>
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
        className={`no-print w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)] px-3 py-4 fixed md:static inset-y-0 left-0 z-50 md:z-auto shadow-sm transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {content}
      </aside>
    </>
  );
}
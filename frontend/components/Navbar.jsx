import React from "react";
import { NavLink } from "react-router-dom";
import { Zap, LayoutDashboard, History, Menu, Factory } from "lucide-react";

export default function Navbar({ onMenuClick }) {
  // Multi-color letters for SATISH - adjusted for Clean White Theme
  const stylishSatish = [
    { char: "S", color: "text-cyan-600 font-extrabold" },
    { char: "a", color: "text-amber-600 font-extrabold" },
    { char: "t", color: "text-emerald-600 font-extrabold" },
    { char: "i", color: "text-purple-600 font-extrabold" },
    { char: "s", color: "text-rose-600 font-extrabold" },
    { char: "h", color: "text-blue-600 font-extrabold" },
  ];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        
        {/* LOGO & BRANDING WITH ATTRACTIVE MULTI-COLORS */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
            <Zap size={18} className="text-white" />
          </div>

          <div>
            {/* CGL INDUCTOR MONITORING - MULTI-COLOR WORDS */}
            <div className="font-extrabold text-sm leading-tight tracking-wide flex items-center gap-1.5">
              <span className="text-cyan-600">CGL</span>
              <span className="text-amber-600">INDUCTOR</span>
              <span className="text-emerald-600">MONITORING</span>
            </div>

            {/* APL APOLLO SUB-TEXT - MULTI-COLOR WORDS */}
            <div className="text-[11px] font-medium hidden sm:flex items-center gap-1">
              <span className="text-rose-600 font-semibold">APL</span>
              <span className="text-purple-600 font-semibold">Apollo</span>
              <span className="text-blue-600 font-semibold">Building</span>
              <span className="text-sky-600 font-semibold">Products</span>
              <span className="text-slate-500 font-semibold">Ltd.</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-600 font-bold">Electrical</span>
              <span className="text-emerald-600 font-bold">Dept.</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS WITH DISTINCT ATTRACTIVE LIGHT COLORS */}
        <nav className="flex items-center gap-2.5">
          {/* DASHBOARD - CYAN THEME */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-cyan-100/90 text-cyan-800 border-cyan-300 shadow-sm"
                  : "text-cyan-700 border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100/60 hover:text-cyan-900"
              }`
            }
          >
            <LayoutDashboard size={14} className="text-cyan-600" /> Dashboard
          </NavLink>

          {/* PRODUCTION & DROSS - EMERALD THEME */}
          <NavLink
            to="/production-dross"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-emerald-100/90 text-emerald-800 border-emerald-300 shadow-sm"
                  : "text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 hover:text-emerald-900"
              }`
            }
          >
            <Factory size={14} className="text-emerald-600" /> Production &amp; Dross
          </NavLink>

          {/* HISTORY - AMBER THEME */}
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-amber-100/90 text-amber-800 border-amber-300 shadow-sm"
                  : "text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 hover:text-amber-900"
              }`
            }
          >
            <History size={14} className="text-amber-600" /> History
          </NavLink>
        </nav>

        {/* STYLISH MULTI-COLOR NAME 'SATISH' */}
        <div className="flex items-center px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
          <span className="text-base font-black tracking-widest uppercase">
            {stylishSatish.map((item, index) => (
              <span key={index} className={item.color}>
                {item.char}
              </span>
            ))}
          </span>
        </div>

      </div>
    </header>
  );
}
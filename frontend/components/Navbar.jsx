import React from "react";
import { NavLink } from "react-router-dom";
import { Zap, LayoutDashboard, History, Menu, Factory } from "lucide-react";

export default function Navbar({ onMenuClick }) {
  // Multi-color letters for SATISH
  const stylishSatish = [
    { char: "S", color: "text-cyan-600 font-black" },
    { char: "a", color: "text-amber-600 font-black" },
    { char: "t", color: "text-emerald-600 font-black" },
    { char: "i", color: "text-purple-600 font-black" },
    { char: "s", color: "text-rose-600 font-black" },
    { char: "h", color: "text-blue-600 font-black" },
  ];

  // Colorful characters for DASHBOARD
  const dashboardChars = [
    { char: "D", color: "text-cyan-600" },
    { char: "a", color: "text-blue-600" },
    { char: "s", color: "text-indigo-600" },
    { char: "h", color: "text-purple-600" },
    { char: "b", color: "text-rose-600" },
    { char: "o", color: "text-amber-600" },
    { char: "a", color: "text-emerald-600" },
    { char: "r", color: "text-teal-600" },
    { char: "d", color: "text-cyan-700" },
  ];

  // Colorful characters for PRODUCTION & DROSS
  const productionChars = [
    { char: "P", color: "text-emerald-600" },
    { char: "r", color: "text-teal-600" },
    { char: "o", color: "text-cyan-600" },
    { char: "d", color: "text-blue-600" },
    { char: "u", color: "text-indigo-600" },
    { char: "c", color: "text-purple-600" },
    { char: "t", color: "text-pink-600" },
    { char: "i", color: "text-rose-600" },
    { char: "o", color: "text-red-600" },
    { char: "n", color: "text-amber-600" },
    { char: " ", color: "" },
    { char: "&", color: "text-yellow-600 font-black" },
    { char: " ", color: "" },
    { char: "D", color: "text-emerald-600" },
    { char: "r", color: "text-teal-600" },
    { char: "o", color: "text-cyan-600" },
    { char: "s", color: "text-blue-600" },
    { char: "s", color: "text-purple-600" },
  ];

  // Colorful characters for HISTORY
  const historyChars = [
    { char: "H", color: "text-amber-600" },
    { char: "i", color: "text-orange-600" },
    { char: "s", color: "text-rose-600" },
    { char: "t", color: "text-purple-600" },
    { char: "o", color: "text-blue-600" },
    { char: "r", color: "text-cyan-600" },
    { char: "y", color: "text-emerald-600" },
  ];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-[1700px] mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-3 lg:gap-6 flex-wrap">
        
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
            <Zap size={20} className="text-white" />
          </div>

          <div>
            <div className="font-black text-sm lg:text-base leading-tight tracking-wide flex items-center gap-1.5">
              <span className="text-cyan-600">CGL</span>
              <span className="text-amber-600">INDUCTOR</span>
              <span className="text-emerald-600">MONITORING</span>
            </div>

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

        {/* BIGGER MULTI-COLOR NAVIGATION BLOCKS (ADAPTS TO LAPTOP/DESKTOP) */}
        <nav className="flex items-center gap-2 lg:gap-4 overflow-x-auto py-1">
          
          {/* DASHBOARD BLOCK */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all border shadow-sm shrink-0 ${
                isActive
                  ? "bg-cyan-100/90 border-cyan-400 shadow-cyan-500/10 scale-105"
                  : "border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300"
              }`
            }
          >
            <LayoutDashboard size={18} className="text-cyan-600 shrink-0" />
            <span className="tracking-wide">
              {dashboardChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

          {/* PRODUCTION & DROSS BLOCK */}
          <NavLink
            to="/production-dross"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all border shadow-sm shrink-0 ${
                isActive
                  ? "bg-emerald-100/90 border-emerald-400 shadow-emerald-500/10 scale-105"
                  : "border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300"
              }`
            }
          >
            <Factory size={18} className="text-emerald-600 shrink-0" />
            <span className="tracking-wide">
              {productionChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

          {/* HISTORY BLOCK */}
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all border shadow-sm shrink-0 ${
                isActive
                  ? "bg-amber-100/90 border-amber-400 shadow-amber-500/10 scale-105"
                  : "border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300"
              }`
            }
          >
            <History size={18} className="text-amber-600 shrink-0" />
            <span className="tracking-wide">
              {historyChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

        </nav>

        {/* STYLISH MULTI-COLOR NAME 'SATISH' */}
        <div className="flex items-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 shadow-sm shrink-0">
          <span className="text-base lg:text-lg font-black tracking-widest uppercase">
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
import React from "react";
import { NavLink } from "react-router-dom";
import { Zap, LayoutDashboard, History, Menu, Factory } from "lucide-react";

export default function Navbar({ onMenuClick }) {
  // Multi-color letters for SATISH
  const stylishSatish = [
    { char: "S", color: "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" },
    { char: "a", color: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" },
    { char: "t", color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" },
    { char: "i", color: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" },
    { char: "s", color: "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]" },
    { char: "h", color: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" },
  ];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        
        {/* LOGO & BRANDING WITH ATTRACTIVE MULTI-COLORS */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-300 hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Zap size={18} className="text-slate-950" />
          </div>

          <div>
            {/* CGL INDUCTOR MONITORING - MULTI-COLOR WORDS */}
            <div className="font-extrabold text-sm leading-tight tracking-wide flex items-center gap-1.5">
              <span className="text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">CGL</span>
              <span className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">INDUCTOR</span>
              <span className="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">MONITORING</span>
            </div>

            {/* APL APOLLO SUB-TEXT - MULTI-COLOR WORDS */}
            <div className="text-[11px] font-medium hidden sm:flex items-center gap-1">
              <span className="text-rose-400">APL</span>
              <span className="text-purple-400">Apollo</span>
              <span className="text-blue-400">Building</span>
              <span className="text-sky-300">Products</span>
              <span className="text-slate-400">Ltd.</span>
              <span className="text-slate-600">·</span>
              <span className="text-yellow-400 font-semibold">Electrical</span>
              <span className="text-emerald-300 font-semibold">Dept.</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS WITH DISTINCT ATTRACTIVE COLORS */}
        <nav className="flex items-center gap-2.5">
          {/* DASHBOARD - CYAN THEME */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-cyan-400/80 border-cyan-500/20 bg-cyan-950/30 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30"
              }`
            }
          >
            <LayoutDashboard size={14} className="text-cyan-400" /> Dashboard
          </NavLink>

          {/* PRODUCTION & DROSS - EMERALD THEME */}
          <NavLink
            to="/production-dross"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : "text-emerald-400/80 border-emerald-500/20 bg-emerald-950/30 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30"
              }`
            }
          >
            <Factory size={14} className="text-emerald-400" /> Production &amp; Dross
          </NavLink>

          {/* HISTORY - AMBER THEME */}
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  : "text-amber-400/80 border-amber-500/20 bg-amber-950/30 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30"
              }`
            }
          >
            <History size={14} className="text-amber-400" /> History
          </NavLink>
        </nav>

        {/* STYLISH MULTI-COLOR NAME 'SATISH' */}
        <div className="flex items-center px-4 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
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
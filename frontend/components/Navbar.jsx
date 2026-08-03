import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Zap, LayoutDashboard, History, LogOut, Menu, Factory } from "lucide-react";
import useAuth from "../hooks/useAuth.js";

export default function Navbar({ onMenuClick }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* LOGO & BRAND */}
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
            <div className="font-extrabold text-white text-sm leading-tight tracking-wide">
              CGL INDUCTOR MONITORING
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:block">
              APL Apollo Building Products Ltd. · Electrical Dept.
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

        {/* USER PROFILE & LOGOUT */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white tracking-wide">Satish</div>
            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
              Site Admin
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/50 transition-all shadow-sm"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
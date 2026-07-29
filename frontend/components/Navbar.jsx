import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Zap, LayoutDashboard, History, LogOut, Menu, Factory } from "lucide-react";
import useAuth from "../hooks/useAuth.js";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
      isActive ? "bg-cyan-500/15 text-cyan-300" : "text-slate-400 hover:text-white hover:bg-slate-800"
    }`;

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-300 hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Zap size={18} className="text-slate-950" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm leading-tight">CGL INDUCTOR MONITORING</div>
            <div className="text-[11px] text-slate-500 hidden sm:block">APL Apollo Building Products Ltd. · Electrical Dept.</div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard size={14} /> Dashboard
          </NavLink>
          <NavLink to="/production-dross" className={linkClass}>
            <Factory size={14} /> Production &amp; Dross
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            <History size={14} /> History
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{user?.name || user?.username}</div>
            <div className="text-[10px] text-cyan-400">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
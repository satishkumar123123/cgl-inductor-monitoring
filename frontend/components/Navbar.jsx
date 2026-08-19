import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Zap,
  LayoutDashboard,
  History,
  Factory,
  FileBarChart2,
  FileText,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const [reportsOpen, setReportsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileReportsOpen, setMobileReportsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setReportsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown and mobile menu when route changes
  useEffect(() => {
    setReportsOpen(false);
    setMobileMenuOpen(false);
    setMobileReportsOpen(false);
  }, [location]);

  // Multi-color letters for WIDER ELECTRICAL
  const stylishWiderElectrical = [
    { char: "W", color: "text-cyan-600 font-black" },
    { char: "I", color: "text-amber-600 font-black" },
    { char: "D", color: "text-emerald-600 font-black" },
    { char: "E", color: "text-purple-600 font-black" },
    { char: "R", color: "text-rose-600 font-black" },
    { char: " ", color: "" },
    { char: "E", color: "text-blue-600 font-black" },
    { char: "L", color: "text-indigo-600 font-black" },
    { char: "E", color: "text-pink-600 font-black" },
    { char: "C", color: "text-teal-600 font-black" },
    { char: "T", color: "text-amber-600 font-black" },
    { char: "R", color: "text-cyan-600 font-black" },
    { char: "I", color: "text-purple-600 font-black" },
    { char: "C", color: "text-rose-600 font-black" },
    { char: "A", color: "text-emerald-600 font-black" },
    { char: "L", color: "text-blue-600 font-black" },
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

  // Colorful characters for REPORTS
  const reportsChars = [
    { char: "R", color: "text-purple-600" },
    { char: "e", color: "text-pink-600" },
    { char: "p", color: "text-rose-600" },
    { char: "o", color: "text-amber-600" },
    { char: "r", color: "text-emerald-600" },
    { char: "t", color: "text-cyan-600" },
    { char: "s", color: "text-blue-600" },
  ];

  // Colorful characters for PM POT Analysis Report
  const pmPotChars = [
    { char: "P", color: "text-purple-600" },
    { char: "M", color: "text-pink-600" },
    { char: " ", color: "" },
    { char: "P", color: "text-rose-600" },
    { char: "O", color: "text-red-600" },
    { char: "T", color: "text-amber-600" },
    { char: " ", color: "" },
    { char: "A", color: "text-emerald-600" },
    { char: "n", color: "text-teal-600" },
    { char: "a", color: "text-cyan-600" },
    { char: "l", color: "text-blue-600" },
    { char: "y", color: "text-indigo-600" },
    { char: "s", color: "text-purple-600" },
    { char: "i", color: "text-pink-600" },
    { char: "s", color: "text-rose-600" },
  ];

  // Colorful characters for MAIN POT Analysis Report
  const mainPotChars = [
    { char: "M", color: "text-cyan-600" },
    { char: "A", color: "text-teal-600" },
    { char: "I", color: "text-emerald-600" },
    { char: "N", color: "text-amber-600" },
    { char: " ", color: "" },
    { char: "P", color: "text-rose-600" },
    { char: "O", color: "text-indigo-600" },
    { char: "T", color: "text-purple-600" },
    { char: " ", color: "" },
    { char: "A", color: "text-blue-600" },
    { char: "n", color: "text-cyan-600" },
    { char: "a", color: "text-teal-600" },
    { char: "l", color: "text-emerald-600" },
    { char: "y", color: "text-amber-600" },
    { char: "s", color: "text-rose-600" },
    { char: "i", color: "text-indigo-600" },
    { char: "s", color: "text-purple-600" },
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

  const isReportsActive = location.pathname.startsWith("/reports");

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-md">
      <div className="max-w-[1750px] mx-auto px-3 xl:px-6 py-2.5 flex items-center justify-between gap-2 xl:gap-4 flex-nowrap">
        
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="group w-10 h-10 xl:w-11 xl:h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)] transition-all duration-300 transform-gpu hover:-translate-y-0.5 hover:rotate-6 shrink-0">
            <Zap size={20} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-110" />
          </div>

          <div className="shrink-0">
            <div className="font-black text-sm xl:text-base leading-tight tracking-wide flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-cyan-600 drop-shadow-xs">CGL</span>
              <span className="text-amber-600 drop-shadow-xs">INDUCTOR</span>
              <span className="text-emerald-600 drop-shadow-xs">MONITORING</span>
            </div>

            <div className="text-[11px] font-bold hidden sm:flex items-center gap-1 mt-0.5 whitespace-nowrap">
              <span className="text-rose-600">APL</span>
              <span className="text-purple-600">Apollo</span>
              <span className="text-blue-600">Building</span>
              <span className="text-sky-600">Products</span>
              <span className="text-slate-600">Ltd.</span>
            </div>
          </div>
        </div>

        {/* 3D NAVIGATION BUTTONS - DESKTOP & LAPTOP (HIDDEN ON MOBILE/TABLET) */}
        <nav className="hidden lg:flex items-center gap-1.5 xl:gap-3 py-1 mr-auto ml-2 xl:ml-4 shrink-0">
          
          {/* DASHBOARD BLOCK */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 shrink-0 transform-gpu cursor-pointer ${
                isActive
                  ? "bg-gradient-to-b from-cyan-50 to-cyan-100/90 border-t border-l border-cyan-300 border-b-[3px] border-r-2 border-b-cyan-500 border-r-cyan-400 text-cyan-900 shadow-[0_6px_12px_rgba(6,182,212,0.25)] -translate-y-0.5"
                  : "bg-gradient-to-b from-white to-slate-100/90 border-t border-l border-white border-b-[3px] border-r border-b-slate-300 border-r-slate-200 text-slate-700 shadow-xs hover:-translate-y-0.5 hover:border-b-cyan-400 hover:shadow-[0_8px_16px_rgba(6,182,212,0.18)] active:translate-y-0 active:border-b active:shadow-inner"
              }`
            }
          >
            <div className="p-1 rounded-lg bg-cyan-50 transition-all duration-300 group-hover:bg-cyan-100 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <LayoutDashboard size={18} className="text-cyan-600 drop-shadow-xs" />
            </div>
            <span className="tracking-wide">
              {dashboardChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

          {/* REPORTS DROPDOWN BLOCK */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setReportsOpen((o) => !o)}
              className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 shrink-0 transform-gpu cursor-pointer ${
                isReportsActive || reportsOpen
                  ? "bg-gradient-to-b from-purple-50 to-purple-100/90 border-t border-l border-purple-300 border-b-[3px] border-r-2 border-b-purple-500 border-r-purple-400 text-purple-900 shadow-[0_6px_12px_rgba(168,85,247,0.25)] -translate-y-0.5"
                  : "bg-gradient-to-b from-white to-slate-100/90 border-t border-l border-white border-b-[3px] border-r border-b-slate-300 border-r-slate-200 text-slate-700 shadow-xs hover:-translate-y-0.5 hover:border-b-purple-400 hover:shadow-[0_8px_16px_rgba(168,85,247,0.18)] active:translate-y-0 active:border-b active:shadow-inner"
              }`}
            >
              <div className="p-1 rounded-lg bg-purple-50 transition-all duration-300 group-hover:bg-purple-100 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
                <FileBarChart2 size={18} className="text-purple-600 drop-shadow-xs" />
              </div>
              <span className="tracking-wide">
                {reportsChars.map((item, idx) => (
                  <span key={idx} className={item.color}>
                    {item.char}
                  </span>
                ))}
              </span>
              <ChevronDown
                size={16}
                className={`text-purple-600 transition-all duration-300 ${
                  reportsOpen ? "rotate-180 scale-110" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* 3D DROPDOWN MENU */}
            {reportsOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_16px_30px_-5px_rgba(0,0,0,0.15)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <NavLink
                  to="/reports/pm-pot"
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 mx-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 hover:-translate-y-0.5 ${
                      isActive
                        ? "bg-purple-100 text-purple-900 shadow-xs border border-purple-200"
                        : "hover:bg-purple-50/80 text-slate-700"
                    }`
                  }
                >
                  <div className="p-1 rounded-lg bg-purple-50 transition-all group-hover:scale-110 group-hover:bg-purple-100">
                    <FileText size={15} className="text-purple-600" />
                  </div>
                  <span className="tracking-wide">
                    {pmPotChars.map((item, idx) => (
                      <span key={idx} className={item.color}>
                        {item.char}
                      </span>
                    ))}
                  </span>
                </NavLink>

                <div className="border-t border-slate-100 my-1 mx-2" />

                <NavLink
                  to="/reports/main-pot"
                  className={({ isActive }) =>
                    `group flex items-center gap-2.5 mx-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all duration-200 hover:-translate-y-0.5 ${
                      isActive
                        ? "bg-cyan-100 text-cyan-900 shadow-xs border border-cyan-200"
                        : "hover:bg-cyan-50/80 text-slate-700"
                    }`
                  }
                >
                  <div className="p-1 rounded-lg bg-cyan-50 transition-all group-hover:scale-110 group-hover:bg-cyan-100">
                    <FileText size={15} className="text-cyan-600" />
                  </div>
                  <span className="tracking-wide">
                    {mainPotChars.map((item, idx) => (
                      <span key={idx} className={item.color}>
                        {item.char}
                      </span>
                    ))}
                  </span>
                </NavLink>
              </div>
            )}
          </div>

          {/* PRODUCTION & DROSS BLOCK */}
          <NavLink
            to="/production-dross"
            className={({ isActive }) =>
              `group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 shrink-0 transform-gpu cursor-pointer ${
                isActive
                  ? "bg-gradient-to-b from-emerald-50 to-emerald-100/90 border-t border-l border-emerald-300 border-b-[3px] border-r-2 border-b-emerald-500 border-r-emerald-400 text-emerald-900 shadow-[0_6px_12px_rgba(16,185,129,0.25)] -translate-y-0.5"
                  : "bg-gradient-to-b from-white to-slate-100/90 border-t border-l border-white border-b-[3px] border-r border-b-slate-300 border-r-slate-200 text-slate-700 shadow-xs hover:-translate-y-0.5 hover:border-b-emerald-400 hover:shadow-[0_8px_16px_rgba(16,185,129,0.18)] active:translate-y-0 active:border-b active:shadow-inner"
              }`
            }
          >
            <div className="p-1 rounded-lg bg-emerald-50 transition-all duration-300 group-hover:bg-emerald-100 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <Factory size={18} className="text-emerald-600 drop-shadow-xs" />
            </div>
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
              `group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 shrink-0 transform-gpu cursor-pointer ${
                isActive
                  ? "bg-gradient-to-b from-amber-50 to-amber-100/90 border-t border-l border-amber-300 border-b-[3px] border-r-2 border-b-amber-500 border-r-amber-400 text-amber-900 shadow-[0_6px_12px_rgba(245,158,11,0.25)] -translate-y-0.5"
                  : "bg-gradient-to-b from-white to-slate-100/90 border-t border-l border-white border-b-[3px] border-r border-b-slate-300 border-r-slate-200 text-slate-700 shadow-xs hover:-translate-y-0.5 hover:border-b-amber-400 hover:shadow-[0_8px_16px_rgba(245,158,11,0.18)] active:translate-y-0 active:border-b active:shadow-inner"
              }`
            }
          >
            <div className="p-1 rounded-lg bg-amber-50 transition-all duration-300 group-hover:bg-amber-100 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
              <History size={18} className="text-amber-600 drop-shadow-xs" />
            </div>
            <span className="tracking-wide">
              {historyChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

        </nav>

        {/* RIGHT SIDE: 3D BADGE & MOBILE HAMBURGER BUTTON */}
        <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
          
          {/* 3D BADGE: WIDER ELECTRICAL */}
          <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-gradient-to-b from-white to-slate-100 border-t border-l border-white border-b-[3px] border-r border-b-slate-300 border-r-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] shrink-0">
            <span className="text-sm sm:text-base xl:text-lg font-black tracking-wider uppercase drop-shadow-xs whitespace-nowrap">
              {stylishWiderElectrical.map((item, index) => (
                <span key={index} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </div>

          {/* MOBILE / TABLET MENU TOGGLE BUTTON (VISIBLE ONLY ON < lg SCREENS) */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl bg-gradient-to-b from-white to-slate-100 border border-slate-200 shadow-xs text-slate-700 hover:text-cyan-600 active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} className="text-rose-600" /> : <Menu size={22} className="text-cyan-700" />}
          </button>

        </div>

      </div>

      {/* MOBILE / TABLET SLIDE-DOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          
          {/* MOBILE: DASHBOARD */}
          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all border ${
                isActive
                  ? "bg-cyan-50 border-cyan-400 text-cyan-900 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-cyan-50"
              }`
            }
          >
            <div className="p-1 rounded-lg bg-cyan-100">
              <LayoutDashboard size={16} className="text-cyan-700" />
            </div>
            <span>
              {dashboardChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

          {/* MOBILE: REPORTS ACCORDION */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <button
              onClick={() => setMobileReportsOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-extrabold text-slate-700 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-purple-100">
                  <FileBarChart2 size={16} className="text-purple-700" />
                </div>
                <span>
                  {reportsChars.map((item, idx) => (
                    <span key={idx} className={item.color}>
                      {item.char}
                    </span>
                  ))}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-purple-600 transition-transform ${mobileReportsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {mobileReportsOpen && (
              <div className="px-3 pb-2 space-y-1.5 bg-white border-t border-slate-100 pt-2">
                <NavLink
                  to="/reports/pm-pot"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black ${
                      isActive ? "bg-purple-100 text-purple-900" : "text-slate-600 hover:bg-purple-50"
                    }`
                  }
                >
                  <FileText size={14} className="text-purple-600" />
                  <span>
                    {pmPotChars.map((item, idx) => (
                      <span key={idx} className={item.color}>
                        {item.char}
                      </span>
                    ))}
                  </span>
                </NavLink>

                <NavLink
                  to="/reports/main-pot"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black ${
                      isActive ? "bg-cyan-100 text-cyan-900" : "text-slate-600 hover:bg-cyan-50"
                    }`
                  }
                >
                  <FileText size={14} className="text-cyan-600" />
                  <span>
                    {mainPotChars.map((item, idx) => (
                      <span key={idx} className={item.color}>
                        {item.char}
                      </span>
                    ))}
                  </span>
                </NavLink>
              </div>
            )}
          </div>

          {/* MOBILE: PRODUCTION & DROSS */}
          <NavLink
            to="/production-dross"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all border ${
                isActive
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50"
              }`
            }
          >
            <div className="p-1 rounded-lg bg-emerald-100">
              <Factory size={16} className="text-emerald-700" />
            </div>
            <span>
              {productionChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

          {/* MOBILE: HISTORY */}
          <NavLink
            to="/history"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all border ${
                isActive
                  ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50"
              }`
            }
          >
            <div className="p-1 rounded-lg bg-amber-100">
              <History size={16} className="text-amber-700" />
            </div>
            <span>
              {historyChars.map((item, idx) => (
                <span key={idx} className={item.color}>
                  {item.char}
                </span>
              ))}
            </span>
          </NavLink>

        </div>
      )}
    </header>
  );
}
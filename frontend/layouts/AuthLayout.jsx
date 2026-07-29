import React from "react";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-industrial-bg text-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Zap size={26} className="text-slate-950" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-extrabold text-white tracking-wide">CGL INDUCTOR DAILY MONITORING</h1>
            <p className="text-xs text-slate-500 mt-1">APL Apollo Building Products Ltd. · Electrical Department</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

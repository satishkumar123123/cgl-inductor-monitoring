import React from "react";

export default function StatCard({ icon: Icon, label, value, sub, accent = "text-cyan-600", className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-1.5 min-w-0 transition-all ${className}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {Icon && <Icon size={14} className={accent} />}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-xl font-black text-slate-900 truncate">{value}</div>
      {sub && <div className="text-[11px] font-medium text-slate-500 truncate">{sub}</div>}
    </div>
  );
}
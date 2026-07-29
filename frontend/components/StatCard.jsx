import React from "react";

export default function StatCard({ icon: Icon, label, value, sub, accent = "text-cyan-400" }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        {Icon && <Icon size={13} className={accent} />}
        {label}
      </div>
      <div className="text-xl font-bold text-white truncate">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}
